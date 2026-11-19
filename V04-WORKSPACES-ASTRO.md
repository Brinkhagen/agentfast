# AgentFast v0.4 — Workspace and Astro import analysis

AgentFast produces **advisory test recommendations** from Git changes. It does not run tests, prove coverage, resolve individual symbols, or replace your full protected CI.

## What is supported in v0.4

- Local JS/TS/JSX/TSX imports, re-exports, literal dynamic imports and CommonJS `require` through the existing file-level graph.
- Simple root `tsconfig.json` / `jsconfig.json` path aliases (from v0.3).
- Root `package.json` npm/yarn workspaces declared as direct-child globs such as `"packages/*"`, `"apps/*"`, or explicit package directories.
- Imports by workspace package name such as `@example/ui` or an explicit `exports["./card"]` subpath. An export must refer to an unambiguous, local file inside its own package. Simple root `source`, `module`, or `main` entries are also recognized when `exports` is absent.
- Static imports in Astro `---` frontmatter and ordinary inline `<script>` blocks. Astro components are traversed as file-level dependencies, including when imported by tests.

Example monorepo:

```text
package.json             # {"private":true,"workspaces":["packages/*","apps/*"]}
packages/ui/package.json # {"name":"@example/ui","exports":{".":"./src/button.tsx"}}
packages/ui/src/button.tsx
apps/web/src/App.tsx      # import { Button } from '@example/ui'
apps/web/src/Page.astro   # frontmatter: import App from './App.tsx'
apps/web/tests/page.test.ts
```

An edit in `packages/ui/src/button.tsx` can suggest `apps/web/tests/page.test.ts` for **quick feedback**. Required full CI still runs before merge or release.

## Run the reproducible demo

With Node.js 20+ and Git installed, from an AgentFast checkout:

```bash
npm ci
npm run demo:workspaces
```

The demo creates a temporary monorepo in your OS temp directory, runs the real AgentFast CLI against two changes and verifies both outcomes:

- A local UI code change produces a `targeted` recommendation and names the test file.
- An authentication change produces a `full` recommendation.

It deletes the fixture afterward and does not access the network. The demo verifies behavior, **not** a speedup.

## Conservative limitations

AgentFast deliberately recommends broader tests when it cannot resolve imports with sufficient confidence. This includes:

- pnpm-only `pnpm-workspace.yaml` package declarations without supported root workspaces
- Nested, exclusion, recursive or advanced workspace globs
- Conditional and wildcard package exports, package entry points resolving to missing build artifacts
- Ambiguous or duplicate package names, symlinks, targets outside the package
- `tsconfig` inheritance and references, package-local aliases, bundler-specific resolution
- Nonliteral dynamic imports, `import.meta.glob`, unparseable Astro frontmatter or external Astro script sources

The file-level import graph is heuristic, and not equivalent to the TypeScript or Astro compilers. It does not trace **individual symbol-level dependencies**, guarantee sub-second results, or establish a statistically measured reduction in CI time.

If you find a real React/Astro/workspace project where a test is missed, please [file a bug](https://github.com/Brinkhagen/agentfast/issues/new/choose) with a minimal redacted fixture. Do not upload proprietary source or secrets. Run full required CI even when AgentFast suggests a targeted feedback test.

## Stability

- Output schema: `schemaVersion: 1` (existing fields retained)
- No runtime dependencies, API keys, telemetry or automatic test execution
- Node.js 20+, local-only Git analysis
- Cross-platform CI: Linux, macOS, Windows with Node.js 20 and 22
