#!/usr/bin/env node
/**
 * Controlled, reproducible comparison of AgentFast's advisory decision and
 * Vitest's native Git-based test selection on the SAME temporary TS fixture.
 * Requires npm registry access for a one-time pinned Vitest installation.
 * Does not compare speed; Vitest executes tests, AgentFast does not.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const agentfast = join(repo, 'bin/agentfast.js');
const root = mkdtempSync(join(tmpdir(), 'agentfast-vitest-compare-'));
const outputIndex = process.argv.indexOf('--output');
if (outputIndex < 0 && process.argv.length > 2) throw new Error('Only --output <path> is supported.');
if (outputIndex >= 0 && (outputIndex !== 2 || !process.argv[3] || process.argv.length !== 4)) throw new Error('Expected --output <path>.');

function put(path, body) {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, body, 'utf8');
}
function call(program, args, { cwd = root, timeout = 120000 } = {}) {
  const begin = process.hrtime.bigint();
  const r = spawnSync(program, args, { cwd, encoding: 'utf8', windowsHide: true, shell: false, timeout, maxBuffer: 8 * 1024 * 1024 });
  const elapsedMs = Number(process.hrtime.bigint() - begin) / 1e6;
  if (r.error || r.status !== 0) throw new Error([program, ...args].join(' ') + '\n' + (r.error?.message || r.stderr || r.stdout || 'exit=' + r.status));
  return { text: r.stdout, elapsedMs: Number(elapsedMs.toFixed(2)) };
}
function filesFromVitest(data) {
  if (!Array.isArray(data.testResults)) throw new Error('Unexpected Vitest JSON reporter schema');
  return [...new Set(data.testResults.map(test => relative(root, test.name).replaceAll('\\', '/')))].sort();
}

try {
  put('package.json', JSON.stringify({ name: 'agentfast-vitest-comparison', version: '1.0.0', private: true, type: 'module', devDependencies: { vitest: '5.1.0' } }, null, 2));
  put('.gitignore', 'node_modules/\n.vitest/\n');
  put('src/math.ts', 'export const add = (a: number, b: number) => a + b;\n');
  put('src/auth/session.ts', 'export const active = () => true;\n');
  put('tests/math.test.ts', "import { test, expect } from 'vitest';\nimport { add } from '../src/math.ts';\ntest('math', () => expect(add(1, 2)).toBe(3));\n");
  put('tests/session.test.ts', "import { test, expect } from 'vitest';\nimport { active } from '../src/auth/session.ts';\ntest('session', () => expect(active()).toBe(true));\n");
  // First install Vitest so its lockfile is part of the unchanged Git baseline.
  call('npm', ['install', '--no-audit', '--no-fund'], { timeout: 180000 });
  const version = JSON.parse(readFileSync(join(root, 'node_modules/vitest/package.json'), 'utf8')).version;
  assert.equal(version, '5.1.0');
  call('git', ['init', '-q']);
  call('git', ['config', 'user.name', 'AgentFast Comparison']);
  call('git', ['config', 'user.email', 'test@example.invalid']);
  call('git', ['add', '.']);
  call('git', ['commit', '-qm', 'baseline']);

  const cases = [
    {
      id: 'ordinary-typescript',
      modifications: { 'src/math.ts': 'export const add = (a: number, b: number) => a + b + 0;\n' },
      agentfastMode: 'targeted',
      expectedVitestTests: ['tests/math.test.ts']
    },
    {
      id: 'auth-policy',
      modifications: { 'src/auth/session.ts': 'export const active = () => (true);\n' },
      agentfastMode: 'full',
      expectedVitestTests: ['tests/session.test.ts']
    },
    {
      id: 'unresolved-extra-import',
      modifications: {
        'src/math.ts': 'export const add = (a: number, b: number) => a + b + 0;\n',
        'src/broken.ts': "import './missing-file.ts';\n"
      },
      agentfastMode: 'full',
      expectedVitestTests: ['tests/math.test.ts']
    },
    {
      id: 'package-config-policy',
      modifications: {
        'package.json': JSON.stringify({ name: 'agentfast-vitest-comparison', version: '1.0.0', private: true, type: 'module', benchmarkNote: 1, devDependencies: { vitest: '5.1.0' } }, null, 2)
      },
      agentfastMode: 'full',
      // Vitest's config-trigger behavior can depend on installed version; record actual selection.
      expectedVitestTests: null
    }
  ];
  const results = [];
  for (const c of cases) {
    call('git', ['reset', '--hard', 'HEAD']);
    call('git', ['clean', '-fd']);
    for (const [path, body] of Object.entries(c.modifications)) put(path, body);
    const a = call(process.execPath, [agentfast, 'check', '--root', root, '--base', 'HEAD', '--format', 'json']);
    const advisory = JSON.parse(a.text);
    assert.equal(advisory.decision.mode, c.agentfastMode, c.id + ': unexpected AgentFast recommendation');
    const report = join(dirname(root), 'agentfast-vitest-' + process.pid + '-' + c.id + '.json');
    try {
      const v = call(process.execPath, [join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--changed', 'HEAD', '--reporter=json', '--outputFile', report], { timeout: 90000 });
      const selected = filesFromVitest(JSON.parse(readFileSync(report, 'utf8')));
      if (c.expectedVitestTests) assert.deepEqual(selected, c.expectedVitestTests, c.id + ': Vitest selection changed, review the fixture');
      results.push({ scenario: c.id, agentfast: { mode: advisory.decision.mode, reason: advisory.decision.reason, affectedTests: advisory.affectedTests, advisoryCliMs: a.elapsedMs }, vitest: { selectedAndExecutedTestFiles: selected, executionWallMs: v.elapsedMs, version }, interpretation: 'Different tasks: AgentFast suggests verification policy; Vitest selects and runs tests.' });
    } finally {
      rmSync(report, { force: true });
    }
  }
  const summary = {
    methodology: 'same minimal TypeScript Git fixture, baseline HEAD, uncommitted changes, npm vitest 5.1.0',
    note: 'No speedup claim. AgentFast CLI time does not include running tests. Vitest wall time includes test execution. Full CI always mandatory.',
    node: process.version,
    platform: process.platform,
    vitest: version,
    cases: results
  };
  if (outputIndex >= 0) writeFileSync(resolve(process.argv[3]), JSON.stringify(summary, null, 2) + '\n');
  process.stdout.write('AGENTFAST / VITEST controlled test-selection comparison\n');
  for (const c of results) process.stdout.write(c.scenario + ': AgentFast=' + c.agentfast.mode + ' (' + c.agentfast.reason + '), Vitest ran=' + c.vitest.selectedAndExecutedTestFiles.join(', ') + '\n');
  process.stdout.write('Full required CI must still run. No speedup claim.\n');
} finally {
  rmSync(root, { recursive: true, force: true });
}
