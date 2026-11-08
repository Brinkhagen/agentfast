import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runner = join(project, 'bin/agentfast.js');
const root = mkdtempSync(join(tmpdir(), 'agentfast-repro-'));

function file(path, text) {
  const dest = join(root, path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, text);
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', timeout: 12000, windowsHide: true });
  if (result.status !== 0) throw new Error(command + ' ' + args.join(' ') + '\n' + result.stderr);
  return result.stdout;
}

function analyze() {
  return JSON.parse(run(process.execPath, [runner, 'check', '--root', root, '--base', 'HEAD', '--format', 'json']));
}

try {
  run('git', ['init', '-q']);
  run('git', ['config', 'user.name', 'AgentFast Example']);
  run('git', ['config', 'user.email', 'agentfast@example.invalid']);
  file('package.json', JSON.stringify({ private: true, workspaces: ['packages/*', 'apps/*'] }));
  file('packages/ui/package.json', JSON.stringify({ name: '@example/ui', exports: { '.': './src/button.tsx' } }));
  const initialButton = 'export const Button = () => null;\n';
  file('packages/ui/src/button.tsx', initialButton);
  file('packages/ui/src/auth/session.ts', 'export const session = true;\n');
  file('apps/web/src/App.tsx', "import { Button } from '@example/ui';\nexport default Button;\n");
  file('apps/web/src/Page.astro', "---\nimport App from './App.tsx';\n---\n<main><App /></main>\n");
  file('apps/web/tests/page.test.ts', "import Page from '../src/Page.astro';\n");
  run('git', ['add', '.']);
  run('git', ['commit', '-qm', 'initial reproducible fixture']);

  file('packages/ui/src/button.tsx', 'export const Button = () => "changed";\n');
  const fast = analyze();
  assert.equal(fast.decision.mode, 'targeted');
  assert.deepEqual(fast.affectedTests, ['apps/web/tests/page.test.ts']);
  console.log('Scoped change: TARGETED feedback suggested');
  console.log('  ' + fast.affectedTests.join('\n  '));

  file('packages/ui/src/button.tsx', initialButton);
  file('packages/ui/src/auth/session.ts', 'export const session = false;\n');
  const guarded = analyze();
  assert.equal(guarded.decision.mode, 'full');
  console.log('Authentication change: FULL suite recommended');
  console.log('  ' + guarded.decision.reason);
  console.log('\nDemo succeeded. Full required CI is still mandatory.');
} finally {
  rmSync(root, { recursive: true, force: true });
}
