#!/usr/bin/env node
/**
 * Dependency-free, reproducible, local AgentFast CLI microbenchmark.
 * Measures analysis command latency, not execution speedups or test durations.
 * Creates and removes its own temporary Git fixtures. Does not access the network.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PROJECT, 'bin', 'agentfast.js');
const iterations = Number(process.env.AGENTFAST_BENCH_ITERATIONS || '7');
if (!Number.isInteger(iterations) || iterations < 3 || iterations > 50) {
  throw new Error('AGENTFAST_BENCH_ITERATIONS must be an integer from 3 to 50.');
}
const outputIndex = process.argv.indexOf('--output');
if (outputIndex >= 0 && (!process.argv[outputIndex + 1] || process.argv.length !== outputIndex + 2)) {
  throw new Error('Use --output <new-or-existing-json-file> as the final arguments.');
}
if (outputIndex < 0 && process.argv.length > 2) throw new Error('Only --output <file> is supported.');

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, encoding: 'utf8', windowsHide: true, shell: false, timeout: 15000, maxBuffer: 4 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    throw new Error([cmd, ...args].join(' ') + ': ' + (result.error?.message || result.stderr || 'exit ' + result.status));
  }
  return result.stdout;
}
function put(root, path, contents) {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents, 'utf8');
}
const cases = [
  {
    id: 'plain-typescript',
    files: {
      'src/math.ts': 'export const add = (a: number, b: number) => a + b;\n',
      'tests/math.test.ts': "import { add } from '../src/math.ts';\n"
    },
    changed: { 'src/math.ts': 'export const add = (a: number, b: number) => a - b;\n' },
    mode: 'targeted',
    tests: ['tests/math.test.ts']
  },
  {
    id: 'auth-high-risk',
    files: {
      'src/auth/session.ts': 'export const value = 1;\n',
      'tests/session.test.ts': "import { value } from '../src/auth/session.ts';\n"
    },
    changed: { 'src/auth/session.ts': 'export const value = 2;\n' },
    mode: 'full'
  },
  {
    id: 'unresolved-import',
    files: {
      'src/math.ts': 'export const value = 1;\n',
      'tests/math.test.ts': "import { value } from '../src/math.ts';\n",
      'src/broken.ts': "import './missing.ts';\n"
    },
    changed: { 'src/math.ts': 'export const value = 2;\n' },
    mode: 'full'
  },
  {
    id: 'package-configuration',
    files: { 'package.json': '{"name":"fixture","version":"1.0.0"}\n' },
    changed: { 'package.json': '{"name":"fixture","version":"1.0.1"}\n' },
    mode: 'full'
  },
  {
    id: 'tsconfig-alias',
    files: {
      'tsconfig.json': '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}\n',
      'src/math.ts': 'export const value = 1;\n',
      'tests/math.test.ts': "import { value } from '@/math';\n"
    },
    changed: { 'src/math.ts': 'export const value = 2;\n' },
    mode: 'targeted',
    tests: ['tests/math.test.ts']
  },
  {
    id: 'astro-workspace',
    files: {
      'package.json': '{"private":true,"workspaces":["packages/*","apps/*"]}\n',
      'packages/ui/package.json': '{"name":"@fixture/ui","exports":{".":"./src/button.tsx"}}\n',
      'packages/ui/src/button.tsx': 'export const Button = () => null;\n',
      'apps/web/src/App.tsx': "import { Button } from '@fixture/ui';\nexport default Button;\n",
      'apps/web/src/Page.astro': "---\nimport App from './App.tsx';\n---\n<App />\n",
      'apps/web/tests/page.test.ts': "import Page from '../src/Page.astro';\n"
    },
    changed: { 'packages/ui/src/button.tsx': 'export const Button = () => "updated";\n' },
    mode: 'targeted',
    tests: ['apps/web/tests/page.test.ts']
  },
  {
    id: 'docs-only',
    files: { 'README.md': '# Initial\n' },
    changed: { 'README.md': '# Updated\n' },
    mode: 'none'
  }
];
const percentile = (arr, p) => {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))];
};
const fixed = n => Number(n.toFixed(2));
const results = [];
const root = mkdtempSync(join(tmpdir(), 'agentfast-benchmark-'));
try {
  for (const c of cases) {
    const dir = join(root, c.id);
    mkdirSync(dir, { recursive: true });
    run('git', ['init', '-q'], dir);
    run('git', ['config', 'user.name', 'AgentFast Benchmark'], dir);
    run('git', ['config', 'user.email', 'benchmark@example.invalid'], dir);
    for (const [path, source] of Object.entries(c.files)) put(dir, path, source);
    run('git', ['add', '.'], dir);
    run('git', ['commit', '-qm', 'baseline'], dir);
    for (const [path, source] of Object.entries(c.changed)) put(dir, path, source);

    const measure = () => {
      const start = process.hrtime.bigint();
      const raw = run(process.execPath, [CLI, 'check', '--base', 'HEAD', '--format', 'json'], dir);
      const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
      const plan = JSON.parse(raw);
      assert.equal(plan.decision.mode, c.mode, c.id + ': incorrect mode');
      if (c.tests) assert.deepEqual(plan.affectedTests, c.tests, c.id + ': unexpected affected tests');
      return elapsed;
    };
    measure(); // Warmup: exclude process start and disk cache cold-start from reported samples.
    const ms = Array.from({ length: iterations }, measure);
    const mean = ms.reduce((a, b) => a + b, 0) / ms.length;
    results.push({ case: c.id, expectedDecision: c.mode, iterations, meanMs: fixed(mean), medianMs: fixed(percentile(ms, 0.5)), p95Ms: fixed(percentile(ms, 0.95)), minMs: fixed(Math.min(...ms)), maxMs: fixed(Math.max(...ms)) });
  }
  const result = {
    benchmark: 'AgentFast CLI process-start + Git analysis latency',
    version: '1',
    caveats: [
      'Synthetic tiny fixtures only. These are not real-repository measurements.',
      'Times include Node process startup and Git subprocesses, but NOT test execution.',
      'No Vitest/Jest/other runner measured. This is not a comparative speedup benchmark.',
      'Local hardware, OS, cache and CI load influence timings.',
      'A targeted recommendation does not replace full CI.'
    ],
    environment: { node: process.version, platform: process.platform, arch: process.arch, git: run('git', ['--version'], root).trim() },
    results
  };
  const text = JSON.stringify(result, null, 2) + '\n';
  if (outputIndex >= 0) writeFileSync(resolve(process.argv[outputIndex + 1]), text, 'utf8');
  process.stdout.write('AGENTFAST / reproducible local advisory benchmark\n');
  for (const r of results) process.stdout.write(r.case + ': ' + r.expectedDecision.toUpperCase() + ', median ' + r.medianMs + ' ms (n=' + iterations + ')\n');
  process.stdout.write('Not comparable to Vitest runtime or a full CI run. Full protected CI remains required.\n');
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      '## AgentFast local synthetic benchmark\n\n| Fixture | Decision | Median CLI latency (ms) | p95 (ms) |\n|---|---|---:|---:|\n' +
      results.map(r => '| ' + r.case + ' | ' + r.expectedDecision + ' | ' + r.medianMs + ' | ' + r.p95Ms + ' |').join('\n') +
      '\n\n**Synthetic fixtures only. Not a speedup comparison or replacement for required CI.**\n');
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
