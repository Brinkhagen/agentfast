import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { previewSymbolConsumers } from '../src/symbol-consumers.js';

let typescript;
try { typescript = createRequire(import.meta.url)('typescript'); } catch { /* optional dependency */ }

function fixture(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'agentfast-symbol-consumers-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}
const changed = [{ path: 'src/math.ts', changedExports: [{ name: 'add', change: 'modified' }] }];

test('consumers are only research hints, and use imported original symbol names', { skip: !typescript }, t => {
  const root = fixture(t, {
    'src/math.ts': 'export const add = (a: number) => a + 1; export const keep = 1;',
    'src/barrel.ts': "export { add as plus } from './math.ts';",
    'tests/add.test.ts': "import { add as calculate } from '../src/math.ts';",
    'tests/keep.test.ts': "import { keep } from '../src/math.ts';",
    'tests/barrel.test.ts': "import { plus } from '../src/barrel.ts';"
  });
  const result = previewSymbolConsumers(root, changed, { typescript });
  assert.equal(result.status, 'preview');
  assert.deepEqual(result.candidates[0].directImporters, ['src/barrel.ts', 'tests/add.test.ts']);
  assert.deepEqual(result.candidates[0].possibleTests, ['tests/add.test.ts', 'tests/barrel.test.ts']);
  assert.doesNotMatch(result.candidates[0].possibleTests.join(' '), /keep/);
  assert.match(result.disclaimer, /MUST NOT replace/);
});

test('default imports map to default export as possible consumer', { skip: !typescript }, t => {
  const root = fixture(t, {
    'src/math.ts': 'export default function add() {}',
    'tests/default.test.ts': "import add from '../src/math.ts';"
  });
  const result = previewSymbolConsumers(root, [{ path: 'src/math.ts', changedExports: [{ name: 'default' }] }], { typescript });
  assert.deepEqual(result.candidates[0].possibleTests, ['tests/default.test.ts']);
});

test('computed imports and unresolved aliases produce diagnostics, never exclusion claims', { skip: !typescript }, t => {
  const root = fixture(t, {
    'src/math.ts': 'export const add = 2;',
    'src/computed.ts': "const dynamic = () => import('./math.ts');",
    'tests/maybe.test.ts': "import thing from '@/unknown-alias';"
  });
  const result = previewSymbolConsumers(root, changed, { typescript });
  assert.equal(result.status, 'partial');
  assert.ok(result.diagnostics.some(x => /dynamic|CommonJS/i.test(x.reason)));
  assert.ok(result.diagnostics.some(x => /Non-relative/.test(x.reason)));
  assert.match(result.disclaimer, /full CI/);
});

test('cyclic barrel imports terminate and do not invent missing tests', { skip: !typescript }, t => {
  const root = fixture(t, {
    'src/math.ts': "export const add = 1; import { other } from './barrel.ts';",
    'src/barrel.ts': "export { add } from './math.ts'; export const other = 1;",
    'tests/cycle.test.ts': "import { add } from '../src/barrel.ts';"
  });
  const result = previewSymbolConsumers(root, changed, { typescript });
  assert.deepEqual(result.candidates[0].possibleTests, ['tests/cycle.test.ts']);
});

test('without an installed parser it explicitly reports unavailable', t => {
  const root = fixture(t, { 'src/math.ts': 'export const add = 1;' });
  assert.equal(previewSymbolConsumers(root, changed).status, 'unavailable');
});
