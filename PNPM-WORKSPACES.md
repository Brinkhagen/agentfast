# pnpm workspace imports — supported subset (v0.6)

AgentFast v0.6.0 recognizes **simple** `pnpm-workspace.yaml` lists to link local JavaScript/TypeScript package imports to tests in other workspace packages.

## Supported configuration

```yaml
# comments and CRLF are fine
packages:
  - 'packages/*'
  - "apps/*"
```

A matching package must contain a readable `package.json` with a unique package name and an unambiguous **local source file entry**.

```text
pnpm-workspace.yaml
packages/ui/package.json  # {"name":"@acme/ui","exports":{".":"./src/Button.tsx"}}
packages/ui/src/Button.tsx
apps/web/src/App.tsx       # import { Button } from '@acme/ui'
apps/web/tests/app.test.tsx
```

A change in `packages/ui/src/Button.tsx` may lead AgentFast to recommend `apps/web/tests/app.test.tsx` for **fast local feedback**. This is file-level and does not inspect which exported symbol each test actually uses.

## Reproduce with real Git and CLI

```bash
npm ci
npm run demo:pnpm
```

The demo creates an isolated local Git repository, checks that a source modification recommends the test file, modifies the workspace YAML to an unsupported glob, and confirms the advice falls back to the full suite. The fixture is removed afterward.

## Deliberate limitations

- Only root `packages:` plus indented `- <path>` entries are parsed. Single/double quotes, full-line or trailing comments and CRLF are accepted.
- Only direct-child `packages/*` patterns and exact package directories are supported.
- Negated patterns, recursive `**` globs, bracket patterns, advanced YAML, extra keys such as `catalog:`, anchors and nested configuration are **not** supported.
- If both root `package.json` workspaces and pnpm workspace declarations exist, they must agree exactly; conflicts require full tests.
- Missing/ambiguous source export targets, complex conditional exports, duplicate workspace names and unsupported aliases require full tests.
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` are sensitive configuration files: changes require a full suite.
- This is not equivalent to pnpm's own module resolver or the TypeScript compiler.

**Safety:** The tool suggests quick tests; it neither executes tests nor proves coverage. Run the full protected CI before merge or release.

For a broader explanation see [AgentFast architecture](ARCHITECTURE.md) and [the existing npm/yarn workspace guide](V04-WORKSPACES-ASTRO.md).
