import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { selectPlan } from '../src/analyze.js';
import { loadAliases } from '../src/aliases.js';

const sample = {
  'src/math.ts': 'export const add = (a, b) => a + b;',
  'tests/math.test.ts': "import { add } from '@/math';"
};
function fixture(t, files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'agentfast-alias-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [path, value] of Object.entries({ ...sample, ...files })) {
    const dest = join(root, path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, value);
  }
  return root;
}
function plan(root, path = 'src/math.ts') {
  return selectPlan(root, 'HEAD', [{ path, status: 'modified' }]);
}
const config = paths => JSON.stringify({ compilerOptions: { baseUrl: '.', paths } });

test('wildcard aliases select affected tests', t => {
  const root = fixture(t, { 'tsconfig.json': config({ '@/*': ['src/*'] }) });
  assert.deepEqual(plan(root).affectedTests, ['tests/math.test.ts']);
  assert.equal(plan(root).decision.mode, 'targeted');
});
test('exact alias entries work without a wildcard', t => {
  const root = fixture(t, { 'tsconfig.json': config({ '@/math': ['src/math.ts'] }) });
  assert.equal(plan(root).decision.mode, 'targeted');
});
test('jsconfig aliases are supported', t => {
  const root = fixture(t, { 'jsconfig.json': config({ '@/*': ['src/*'] }) });
  assert.equal(plan(root).decision.mode, 'targeted');
});
test('JSONC comments and trailing commas are handled', t => {
  const root = fixture(t, { 'tsconfig.json': '{ // comment\n "compilerOptions": { "paths": { "@/*": ["src/*",], }, }, }' });
  assert.equal(plan(root).decision.mode, 'targeted');
});
test('unmapped aliases require broad verification', t => {
  const root = fixture(t);
  assert.equal(plan(root).decision.reason, 'INCOMPLETE_DEPENDENCY_GRAPH');
});
test('non-alias third-party package imports do not create false alarms', t => {
  const root = fixture(t, {
    'tsconfig.json': config({ '@/*': ['src/*'] }),
    'tests/math.test.ts': "import React from 'react'; import { add } from '@/math';"
  });
  assert.equal(plan(root).decision.mode, 'targeted');
});
test('alias mapping outside project is never treated as known', t => {
  const root = fixture(t, { 'tsconfig.json': config({ '@/*': ['../external/*'] }) });
  assert.equal(plan(root).decision.mode, 'full');
});
test('multiple targets resolving to different files are ambiguous', t => {
  const root = fixture(t, { 'tsconfig.json': config({ '@/*': ['src/*', 'other/*'] }), 'other/math.ts': 'export const x=1;' });
  assert.equal(plan(root).decision.reason, 'INCOMPLETE_DEPENDENCY_GRAPH');
});
test('extends and inherited settings default to full verification', t => {
  const root = fixture(t, { 'tsconfig.json': JSON.stringify({ extends: './base.json', compilerOptions: { paths: { '@/*': ['src/*'] } } }) });
  assert.equal(plan(root).decision.mode, 'full');
  assert.match(plan(root).diagnostics[0].reason, /unsupported alias configuration/);
});
test('invalid configs default to full verification instead of guessing', t => {
  const root = fixture(t, { 'tsconfig.json': '{ invalid:' });
  assert.equal(plan(root).decision.mode, 'full');
});
test('aliases outside root with baseUrl are rejected', t => {
  const root = fixture(t, { 'tsconfig.json': JSON.stringify({compilerOptions:{baseUrl:'../../external',paths:{'@/*':['src/*']}}}) });
  assert.equal(plan(root).decision.mode, 'full');
});
test('normal config changes still mandate full testing', t => {
  const root = fixture(t, { 'tsconfig.json': config({ '@/*': ['src/*'] }) });
  assert.equal(plan(root, 'tsconfig.json').decision.mode, 'full');
});
test('alias resolver recognizes normal external modules separately', t => {
  const root = fixture(t);
  assert.equal(loadAliases(root).resolve('react', new Set()).kind, 'external');
});

test('nested path aliases link multiple levels without skipping tests', t => {
  const root = fixture(t, {
    'tsconfig.json': config({ '@/*': ['src/*'] }),
    'src/deep/feature/math.ts': 'export const amount = 1;',
    'src/index.ts': "export { amount } from '@/deep/feature/math';",
    'tests/math.test.ts': "import { amount } from '@/deep/feature/math';"
  });
  assert.equal(plan(root, 'src/deep/feature/math.ts').decision.mode, 'targeted');
  assert.deepEqual(plan(root, 'src/deep/feature/math.ts').affectedTests, ['tests/math.test.ts']);
});
test('cyclic aliased imports terminate and keep affected test suggestions conservative', t => {
  const root = fixture(t, {
    'tsconfig.json': config({ '@/*': ['src/*'] }),
    'src/math.ts': "import { next } from '@/other'; export const add = next;",
    'src/other.ts': "import { add } from '@/math'; export const next = add;",
    'tests/math.test.ts': "import { add } from '@/math';"
  });
  const result = plan(root);
  assert.equal(result.decision.mode, 'targeted');
  assert.deepEqual(result.affectedTests, ['tests/math.test.ts']);
});
