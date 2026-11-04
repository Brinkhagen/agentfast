import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { git, listChanges, repositoryRoot, GitError } from './git.js';
import { selectPlan, discover } from './analyze.js';
import { formatReport } from './report.js';
const require = createRequire(import.meta.url);
const { version } = require('../package.json');

export const HELP = `AgentFast ${version} — conservative test planning for AI-assisted changes

Usage:
  agentfast check [--base <git-ref>] [--root <path>] [--json] [--fail-on-full]
  agentfast doctor [--root <path>] [--json]
  agentfast init [--root <path>]
  agentfast --help | --version

Examples:
  agentfast check
  agentfast check --base origin/main
  agentfast check --json
  agentfast check --fail-on-full
  agentfast doctor

Security: AgentFast never sends source code to a remote API or executes tests.
The analysis is conservative and is not a replacement for required CI checks.
`;

function parseArgs(argv) {
  const opts = { command: 'check', base: 'HEAD', root: process.cwd(), json: false, failOnFull: false };
  let i = 0;
  if (argv.length && !argv[0].startsWith('-')) opts.command = argv[i++];
  for (; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.command = 'help';
    else if (arg === '--version' || arg === '-v') opts.command = 'version';
    else if (arg === '--json') opts.json = true;
    else if (arg === '--fail-on-full') opts.failOnFull = true;
    else if (arg === '--base' || arg === '--root') {
      const value = argv[++i];
      if (!value || value.startsWith('-')) throw new Error(`Expected a value after ${arg}`);
      opts[arg === '--base' ? 'base' : 'root'] = value;
    } else throw new Error(`Unknown option: ${arg}`);
  }
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
    if (opts.command === 'doctor') return doctor(resolve(opts.root), opts.json);
    if (opts.command === 'init') return init(resolve(opts.root));
    if (opts.command !== 'check') throw new Error(`Unknown command: ${opts.command}`);
    const root = repositoryRoot(resolve(opts.root));
    const changes = listChanges(root, opts.base);
    const plan = selectPlan(root, opts.base, changes);
    if (opts.json) process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
    else process.stdout.write(formatReport(plan));
    return opts.failOnFull && plan.decision.mode === 'full' ? 2 : 0;
  } catch (error) {
    process.stderr.write(`agentfast: ${error.message}\n`);
    if (error instanceof GitError) process.stderr.write('Hint: run inside a Git repository and check --base.\n');
    return 1;
  }
}
