import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { git, listChanges, repositoryRoot, GitError } from './git.js';
import { selectPlan, discover } from './analyze.js';
import { analyzeSymbolChanges } from './symbols.js';
import { formatReport, formatMarkdownReport } from './report.js';
const require = createRequire(import.meta.url);
const { version } = require('../package.json');

export const HELP = `AgentFast ${version} — conservative test planning for AI-assisted changes

Usage:
  agentfast check [--base <git-ref>] [--root <path>] [--format text|json|markdown] [--output <file>] [--fail-on-full] [--symbol-impact]
  agentfast doctor [--root <path>] [--json]
  agentfast init [--root <path>]
  agentfast --help | --version

Examples:
  agentfast check
  agentfast check --base origin/main
  agentfast check --json
  agentfast check --format markdown
  agentfast check --format markdown --output risk-report.md
  agentfast check --fail-on-full
  agentfast check --format json --symbol-impact
  agentfast doctor

Symbol preview: --symbol-impact requires JSON output and a locally installed TypeScript compiler.
It reports direct exported declaration changes only; never narrows test selection.
Security: AgentFast never sends source code to a remote API or executes tests.
The analysis is conservative and is not a replacement for required CI checks.
`;

function parseArgs(argv) {
  const opts = { command: 'check', base: 'HEAD', root: process.cwd(), json: false, format: 'text', output: null, failOnFull: false, symbolImpact: false };
  let i = 0;
  if (argv.length && !argv[0].startsWith('-')) opts.command = argv[i++];
  for (; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.command = 'help';
    else if (arg === '--version' || arg === '-v') opts.command = 'version';
    else if (arg === '--json') opts.json = true;
    else if (arg === '--fail-on-full') opts.failOnFull = true;
    else if (arg === '--symbol-impact') opts.symbolImpact = true;
    else if (arg === '--format' || arg === '--output' || arg === '--base' || arg === '--root') {
      const value = argv[++i];
      if (!value || value.startsWith('-')) throw new Error(`Expected a value after ${arg}`);
      if (arg === '--format') {
        if (!['text', 'json', 'markdown'].includes(value)) throw new Error('Invalid --format: expected text, json, or markdown.');
        opts.format = value;
      } else if (arg === '--output') opts.output = value;
      else opts[arg === '--base' ? 'base' : 'root'] = value;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  if (opts.json && opts.format === 'markdown') throw new Error('Choose either --json or --format markdown, not both.');
  if (opts.symbolImpact && (opts.command !== 'check' || !(opts.json || opts.format === 'json'))) throw new Error('--symbol-impact requires the check command with --format json or --json.');
  if (opts.command !== 'check' && opts.output) throw new Error('--output is only supported with the check command.');
  if (opts.command !== 'check' && opts.format === 'markdown') throw new Error('--format markdown is only supported with check.');
  return opts;
}

function doctor(root, isJson) {
  const cwd = repositoryRoot(root);
  const files = discover(cwd);
  const versions = { node: process.version, git: git(['--version'], cwd).trim() };
  const packageJson = join(cwd, 'package.json');
  let packageName = null;
  if (existsSync(packageJson)) {
    try { packageName = require(packageJson).name || null; } catch { packageName = null; }
  }
  const info = { tool: 'agentfast', root: cwd, packageName, files: files.files.length,
    scanTruncated: files.truncated, runtime: versions, remoteCalls: false };
  if (isJson) process.stdout.write(JSON.stringify(info, null, 2) + '\n');
  else process.stdout.write([
    'AGENTFAST / DOCTOR', `Repository   ${cwd}`,
    `Package      ${packageName || 'not detected'}`,
    `Files        ${files.files.length}${files.truncated ? '+' : ''}`,
    `Node         ${versions.node}`, `Git          ${versions.git}`,
    'Network      no remote API calls'
  ].join('\n') + '\n');
  return 0;
}

function init(root) {
  const cwd = repositoryRoot(root);
  const path = join(cwd, 'AGENTFAST.md');
  if (existsSync(path)) throw new Error('AGENTFAST.md already exists; refusing to overwrite it.');
  writeFileSync(path, `# AgentFast workflow\n\n` +
    `Use \`agentfast check --base origin/main\` for advisory change-risk analysis.\n\n` +
    `- If AgentFast recommends FULL, run the complete relevant test suite.\n` +
    `- If TARGETED, run suggested tests for quick feedback, then run required full CI before merge.\n` +
    `- AgentFast never proves that a focused test run is sufficient.\n`, { flag: 'wx' });
  process.stdout.write(`Created ${path}\n`);
  return 0;
}

export function main(argv = process.argv.slice(2)) {
  try {
    const opts = parseArgs(argv);
    if (opts.command === 'help') { process.stdout.write(HELP); return 0; }
    if (opts.command === 'version') { process.stdout.write(version + '\n'); return 0; }
    if (opts.command === 'doctor') return doctor(resolve(opts.root), opts.json || opts.format === 'json');
    if (opts.command === 'init') return init(resolve(opts.root));
    if (opts.command !== 'check') throw new Error(`Unknown command: ${opts.command}`);
    const root = repositoryRoot(resolve(opts.root));
    const changes = listChanges(root, opts.base);
    const plan = selectPlan(root, opts.base, changes);
    if (opts.symbolImpact) plan.symbolImpact = analyzeSymbolChanges(root, opts.base, changes);
    const outputFormat = opts.json ? 'json' : opts.format;
    const output = outputFormat === 'json' ? JSON.stringify(plan, null, 2) + '\n' :
      outputFormat === 'markdown' ? formatMarkdownReport(plan) : formatReport(plan, { color: opts.output ? false : undefined });
    if (opts.output) {
      const destination = resolve(opts.output);
      writeFileSync(destination, output, { encoding: 'utf8', flag: 'wx' });
      process.stdout.write('Report created: ' + destination + '\n');
    } else process.stdout.write(output);
    return opts.failOnFull && plan.decision.mode === 'full' ? 2 : 0;
  } catch (error) {
    process.stderr.write(`agentfast: ${error.message}\n`);
    if (error instanceof GitError) process.stderr.write('Hint: run inside a Git repository and check --base.\n');
    return 1;
  }
}
