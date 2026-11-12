import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { selectPlan, classify } from '../src/analyze.js';
import { extractAstroScripts } from '../src/astro.js';

function fixture(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'agentfast-v04-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [path, data] of Object.entries(files)) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, data);
  }
  return root;
}
function plan(root, path) {
  return selectPlan(root, 'HEAD', [{ path, status: 'modified' }]);
}
const mono = {
  'package.json': JSON.stringify({ private: true, workspaces: ['packages/*', 'apps/*'] }),
  'packages/ui/package.json': JSON.stringify({ name: '@example/ui', exports: { '.': './src/button.tsx', './card': './src/card.tsx' } }),
  'packages/ui/src/button.tsx': 'export const Button = () => null;',
  'packages/ui/src/card.tsx': 'export const Card = () => null;',
  'apps/web/src/App.tsx': "import { Button } from '@example/ui'; export default Button;",
  'apps/web/tests/app.test.tsx': "import App from '../src/App';"
};

test('workspace root imports select dependent React app tests', t => {
  const root = fixture(t, mono);
  const p = plan(root, 'packages/ui/src/button.tsx');
  assert.equal(p.decision.mode, 'targeted');
  assert.deepEqual(p.affectedTests, ['apps/web/tests/app.test.tsx']);
});

test('explicit workspace subpath exports are resolved', t => {
  const root = fixture(t, { ...mono, 'apps/web/src/App.tsx': "import { Card } from '@example/ui/card'; export default Card;" });
  assert.deepEqual(plan(root, 'packages/ui/src/card.tsx').affectedTests, ['apps/web/tests/app.test.tsx']);
});

test('third-party imports are not mistaken for local workspaces', t => {
  const root = fixture(t, { ...mono, 'apps/web/src/App.tsx': "import React from 'react'; import { Button } from '@example/ui';" });
  assert.equal(plan(root, 'packages/ui/src/button.tsx').decision.mode, 'targeted');
});

test('workspace package manifest with source entry is supported', t => {
  const root = fixture(t, {
    ...mono,
    'packages/ui/package.json': JSON.stringify({ name: '@example/ui', source: './src/button.tsx' })
  });
  assert.equal(plan(root, 'packages/ui/src/button.tsx').decision.mode, 'targeted');
});

test('workspace missing/conditional source exports fail closed', t => {
  for (const pkg of [
    { name: '@example/ui' },
    { name: '@example/ui', exports: { '.': { import: './src/button.tsx' } } },
    { name: '@example/ui', exports: { '.': './src/does-not-exist.js' } }
  ]) {
    const root = fixture(t, { ...mono, 'packages/ui/package.json': JSON.stringify(pkg) });
    assert.equal(plan(root, 'packages/ui/src/button.tsx').decision.mode, 'full');
  }
});

test('workspace source escape fails closed', t => {
  const root = fixture(t, { ...mono, 'packages/ui/package.json': JSON.stringify({ name: '@example/ui', exports: { '.': './../outside.js' } }) });
  assert.equal(plan(root, 'packages/ui/src/button.tsx').decision.mode, 'full');
});

test('ambiguous workspace source files fail closed', t => {
  const root = fixture(t, {
    ...mono,
    'packages/ui/package.json': JSON.stringify({ name: '@example/ui', exports: { '.': './src/button' } }),
    'packages/ui/src/button.js': 'export default 1;'
  });
  assert.equal(plan(root, 'packages/ui/src/button.tsx').decision.mode, 'full');
});

test('duplicate workspace names fail closed', t => {
  const root = fixture(t, {
    ...mono,
    'packages/another/package.json': JSON.stringify({ name: '@example/ui', exports: { '.': './src/index.ts' } })
  });
  assert.equal(plan(root, 'packages/ui/src/button.tsx').decision.mode, 'full');
});

test('unsupported globs default to full', t => {
  const root = fixture(t, {
    ...mono,
    'package.json': JSON.stringify({ workspaces: ['packages/**'] })
  });
  assert.equal(plan(root, 'packages/ui/src/button.tsx').decision.mode, 'full');
});

test('pnpm-only workspaces are not falsely marked as analyzed', t => {
  const root = fixture(t, {
    'package.json': JSON.stringify({ private: true }),
    'pnpm-workspace.yaml': 'packages:\n  - packages/*',
    'packages/ui/src/foo.ts': 'export const foo = 1;',
    'packages/ui/tests/foo.test.ts': "import '../src/foo';"
  });
  assert.equal(plan(root, 'packages/ui/src/foo.ts').decision.mode, 'full');
  assert.match(plan(root, 'packages/ui/src/foo.ts').diagnostics[0].reason, /workspace/i);
});

test('workspace manifest edits retain high-risk full suite', t => {
  const root = fixture(t, mono);
  assert.equal(plan(root, 'packages/ui/package.json').decision.mode, 'full');
});

test('Astro frontmatter links component imports to impacted tests', t => {
  const root = fixture(t, {
    'src/Card.tsx': 'export default function Card() {return null;}',
    'src/Page.astro': "---\nimport Card from './Card.tsx';\n---\n<main><Card /></main>\n",
    'tests/page.test.ts': "import Page from '../src/Page.astro';"
  });
  const p = plan(root, 'src/Card.tsx');
  assert.equal(p.decision.mode, 'targeted');
  assert.deepEqual(p.affectedTests, ['tests/page.test.ts']);
});

test('Astro inline script imports can link dependencies', t => {
  const root = fixture(t, {
    'src/helper.ts': 'export const x = 1;',
    'src/Counter.astro': "<script>\nimport { x } from './helper.ts';\nconsole.log(x);\n</script>",
    'tests/counter.test.ts': "import Page from '../src/Counter.astro';"
  });
  assert.equal(plan(root, 'src/helper.ts').decision.mode, 'targeted');
});

test('HTML text is not incorrectly treated as an Astro import', () => {
  const out = extractAstroScripts("<p>import x from './fake.ts'</p>");
  assert.equal(out.source, '');
  assert.deepEqual(out.diagnostics, []);
});

test('incomplete Astro frontmatter fails closed', t => {
  const root = fixture(t, {
    'src/Counter.astro': "---\nimport x from './helper.ts'\n<p>No end</p>",
    'src/helper.ts': 'export default 1;',
    'tests/counter.test.ts': "import '../src/Counter.astro';"
  });
  assert.equal(plan(root, 'src/helper.ts').decision.mode, 'full');
});

test('Astro scripts with src attribute fail closed', t => {
  const root = fixture(t, {
    'src/Counter.astro': '<script src="./helper.ts"></script>',
    'src/helper.ts': 'export default 1;',
    'tests/counter.test.ts': "import '../src/Counter.astro';"
  });
  assert.equal(plan(root, 'src/helper.ts').decision.mode, 'full');
});

test('Astro source modifications are not categorized as unknown file types', () => {
  assert.equal(classify('src/Counter.astro').code, 'SOURCE_CHANGE');
});

test('glob imports require broad tests when import graph is incomplete', t => {
  const root = fixture(t, {
    'src/widgets.ts': 'export const x = 1;',
    'src/Page.tsx': "const modules = import.meta.glob('./*.ts');",
    'tests/page.test.ts': "import '../src/Page';"
  });
  assert.equal(plan(root, 'src/widgets.ts').decision.mode, 'full');
});


test('simple pnpm workspaces trace package source through React imports', t => {
  const root = fixture(t, {
    ...mono,
    'package.json': JSON.stringify({ private: true }),
    'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n  - \"apps/*\"\n",
  });
  const p = plan(root, 'packages/ui/src/button.tsx');
  assert.equal(p.decision.mode, 'targeted');
  assert.deepEqual(p.affectedTests, ['apps/web/tests/app.test.tsx']);
});

test('pnpm workspace yaml comments, CRLF, and unquoted simple paths', t => {
  const root = fixture(t, {
    ...mono,
    'package.json': JSON.stringify({ private: true }),
    'pnpm-workspace.yaml': "# workspaces\r\npackages:\r\n  - packages/* # UI packages\r\n  - apps/*\r\n"
  });
  assert.equal(plan(root, 'packages/ui/src/button.tsx').decision.mode, 'targeted');
});

test('matching npm and pnpm declarations are accepted safely', t => {
  const root = fixture(t, { ...mono, 'pnpm-workspace.yaml': "packages:\n  - apps/*\n  - packages/*\n" });
  assert.equal(plan(root, 'packages/ui/src/button.tsx').decision.mode, 'targeted');
});

test('conflicting package.json and pnpm workspace declarations require full suite', t => {
  const root = fixture(t, { ...mono, 'pnpm-workspace.yaml': "packages:\n  - packages/*\n" });
  const p = plan(root, 'packages/ui/src/button.tsx');
  assert.equal(p.decision.mode, 'full');
  assert.match(p.diagnostics[0].reason, /conflicting/);
});

test('unsupported pnpm glob exclusions and recursive globs fall back to full', t => {
  for (const yaml of [
    "packages:\n  - 'packages/**'\n",
    "packages:\n  - '!apps/*'\n",
    "packages: [packages/*]\n",
    "packages:\n  - packages/*\ncatalog:\n  react: 19\n",
    "packages:\n    - packages/*\n"
  ]) {
    const root = fixture(t, {
      ...mono,
      'package.json': JSON.stringify({ private: true }),
      'pnpm-workspace.yaml': yaml
    });
    assert.equal(plan(root, 'packages/ui/src/button.tsx').decision.mode, 'full');
  }
});

test('unsupported pnpm syntax never creates confident targeted recommendations', t => {
  for (const yaml of [
    "packages:\n  - 'packages/*' garbage\n",
    "packages:\n  - packages/* &anchor\n",
    "packages:\n  - \"packages/*\n",
    "other:\n  - packages/*\n"
  ]) {
    const root = fixture(t, {
      ...mono,
      'package.json': JSON.stringify({ private: true }),
      'pnpm-workspace.yaml': yaml
    });
    const p = plan(root, 'packages/ui/src/button.tsx');
    assert.equal(p.decision.mode, 'full');
    assert.match(p.diagnostics[0].reason, /workspace configuration/);
  }
});

test('pnpm changed workspace config retains full verification', t => {
  const root = fixture(t, {
    ...mono,
    'package.json': JSON.stringify({ private: true }),
    'pnpm-workspace.yaml': "packages:\n  - packages/*\n  - apps/*\n"
  });
  assert.equal(plan(root, 'pnpm-workspace.yaml').decision.mode, 'full');
});
