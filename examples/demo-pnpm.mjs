import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = resolve(dirname(fileURLToPath(import.meta.url)), '../bin/agentfast.js');
const root = mkdtempSync(join(tmpdir(), 'agentfast-pnpm-fixture-'));
function file(path, body) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body);
}
function run(exe, args) {
  const result = spawnSync(exe, args, { cwd: root, encoding: 'utf8', timeout: 15000, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(result.stderr || result.error?.message || 'command failed');
  return result.stdout;
}
function check() { return JSON.parse(run(process.execPath, [cli, 'check', '--base', 'HEAD', '--format', 'json'])); }
try {
  run('git', ['init', '-q']);
  run('git', ['config', 'user.name', 'AgentFast pnpm example']);
  run('git', ['config', 'user.email', 'agentfast@example.invalid']);
  file('package.json', '{"name":"fixture","private":true}\n');
  file('pnpm-workspace.yaml', "packages:\n  - 'packages/*'\n  - 'apps/*'\n");
  file('packages/ui/package.json', '{"name":"@fixture/ui","exports":{".":"./src/Button.tsx"}}\n');
  file('packages/ui/src/Button.tsx', 'export const Button = () => "ok";\n');
  file('apps/web/src/App.tsx', "import { Button } from '@fixture/ui';\nexport default Button;\n");
  file('apps/web/tests/app.test.tsx', "import App from '../src/App';\n");
  run('git', ['add', '.']);
  run('git', ['commit', '-qm', 'minimal pnpm fixture']);
  file('packages/ui/src/Button.tsx', 'export const Button = () => "updated";\n');
  const targeted = check();
  assert.equal(targeted.decision.mode, 'targeted');
  assert.deepEqual(targeted.affectedTests, ['apps/web/tests/app.test.tsx']);
  file('pnpm-workspace.yaml', 'packages:\n  - "packages/**"\n');
  const guarded = check();
  assert.equal(guarded.decision.mode, 'full');
  assert.ok(guarded.diagnostics.some(d => /workspace/.test(d.reason)));
  console.log('pnpm workspace import: TARGETED quick feedback ✓');
  console.log('Unsupported pnpm workspace glob: FULL suite recommended ✓');
  console.log('Demo verified. Full protected CI remains mandatory.');
} finally {
  rmSync(root, { recursive: true, force: true });
}
