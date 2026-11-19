#!/usr/bin/env node
/**
 * Pure, testable release calendar gate. This program NEVER publishes or tags.
 * A "planned" target is not approval: reviewers explicitly set "approved"
 * in a reviewed pull request only after confirming all release requirements.
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const STATES = new Set(['planned', 'approved', 'released']);

function parseUtc(value, label) {
  if (typeof value !== 'string' || !UTC.test(value) ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().replace('.000Z', 'Z') !== value) {
    throw new Error(label + ' must be an exact ISO-8601 UTC timestamp ending Z');
  }
  return Date.parse(value);
}

function compareVersion(a, b) {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

export function evaluateCalendar(calendar, {
  now = new Date(),
  packageVersion,
  lockVersion,
  notesExist = () => true
} = {}) {
  if (!calendar || calendar.schemaVersion !== 1 ||
      calendar.timezone !== 'Europe/Berlin' ||
      !Array.isArray(calendar.milestones) || calendar.milestones.length === 0) {
    throw new Error('Invalid release calendar schema, timezone or milestones');
  }
  if (!Number.isFinite(new Date(now).getTime())) throw new Error('Invalid current time');
  if (typeof packageVersion !== 'string' || !SEMVER.test(packageVersion) ||
      typeof lockVersion !== 'string' || !SEMVER.test(lockVersion)) {
    throw new Error('Package and lockfile must have stable semver versions');
  }
  if (packageVersion !== lockVersion) throw new Error('Package and lockfile versions disagree');
  const seen = new Set();
  let previousVersion = null;
  let previousDate = -Infinity;
  for (const item of calendar.milestones) {
    if (!item || typeof item.version !== 'string' || !SEMVER.test(item.version) ||
        !STATES.has(item.status) || seen.has(item.version)) {
      throw new Error('Invalid, duplicated or unsupported calendar milestone');
    }
    if (previousVersion !== null && compareVersion(previousVersion, item.version) >= 0)
      throw new Error('Calendar versions must be strictly increasing');
    previousVersion = item.version;
    seen.add(item.version);
    if (item.status === 'released') {
      parseUtc(item.releasedAt, 'releasedAt for ' + item.version);
      continue;
    }
    const when = parseUtc(item.targetAt, 'targetAt for ' + item.version);
    if (when < previousDate) throw new Error('Scheduled dates must not go backwards');
    previousDate = when;
  }
  const approved = calendar.milestones.filter(item => item.status === 'approved');
  if (approved.length > 1) throw new Error('Exactly zero or one milestone may be approved');
  if (!approved.length) return { publish: false, reason: 'No release approved; planned dates alone never publish.' };
  const candidate = approved[0];
  if (Date.parse(candidate.targetAt) > new Date(now).getTime()) {
    return { publish: false, version: candidate.version,
      reason: 'Approved candidate is not due until ' + candidate.targetAt };
  }
  if (candidate.version !== packageVersion)
    throw new Error('Approved version ' + candidate.version + ' does not match checkout version ' + packageVersion);
  if (!notesExist(candidate.version))
    throw new Error('Missing reviewed release notes for ' + candidate.version);
  return { publish: true, version: candidate.version, reason: 'Approved, due and locally validated.' };
}

export function evaluateRepository(root, now = new Date()) {
  const calendar = JSON.parse(readFileSync(resolve(root, 'config/release-calendar.json'), 'utf8'));
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(readFileSync(resolve(root, 'package-lock.json'), 'utf8'));
  if (pkg.name !== '@brinkhagen/agentfast' || lock.name !== pkg.name ||
      lock.packages?.['']?.version !== lock.version) {
    throw new Error('Package identity or root lockfile version mismatch');
  }
  return evaluateCalendar(calendar, {
    now, packageVersion: pkg.version, lockVersion: lock.version,
    notesExist: version => existsSync(resolve(root, '.github/RELEASE_NOTES_v' + version + '.md'))
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 2) throw new Error('No CLI parameters are accepted');
    const result = evaluateRepository(process.cwd());
    process.stdout.write(JSON.stringify(result) + '\n');
    if (process.env.GITHUB_OUTPUT) {
      appendFileSync(process.env.GITHUB_OUTPUT,
        'publish=' + String(result.publish) + '\nversion=' + (result.version || '') + '\n',
        { encoding: 'utf8' });
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        '### AgentFast release gate\n\n' +
        '- Eligible: **' + (result.publish ? 'yes' : 'no') + '**\n' +
        '- Version: ' + (result.version || 'none') + '\n' +
        '- Reason: ' + result.reason + '\n\n' +
        'No release without human approval, due date, and complete CI/CodeQL verification.\n',
        { encoding: 'utf8' });
    }
  } catch (error) {
    process.stderr.write('release-gate: ' + error.message + '\n');
    process.exitCode = 1;
  }
}
