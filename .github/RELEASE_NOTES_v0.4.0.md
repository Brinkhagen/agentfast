# AgentFast v0.4.0 — Workspaces and Astro, safely

**Ship faster. Verify smarter.** AgentFast v0.4 extends its explainable local test-impact advisory to selected React/TypeScript monorepos and Astro components.

## What's new

- **Workspace imports:** Resolve simple npm/yarn root workspace packages through explicit local `exports` entries and root `source`, `module` or `main` fields.
- **Astro support:** Follow static imports in frontmatter and inline scripts, including `.astro` component references in test dependency chains.
- **Reproducible demo:** `npm run demo:workspaces` exercises a small generated React/Astro monorepo using the real CLI. It verifies both a targeted suggestion and a high-risk full-suite fallback.
- **Regression coverage:** 18 new tests for workspace imports, Astro, malformed configurations and unsafe/unsupported cases.
- **Documentation:** [Supported patterns, example and limitations](https://github.com/Brinkhagen/agentfast/blob/main/docs/V04-WORKSPACES-ASTRO.md).

## Install

**Requirements:** Node.js 20+ and Git.

```bash
npm install -g https://github.com/Brinkhagen/agentfast/releases/download/v0.4.0/brinkhagen-agentfast-0.4.0.tgz
agentfast --version
agentfast check --base HEAD --format markdown
```

To verify in a local checkout:

```bash
npm ci
npm run verify
```

## Safety and compatibility

- **Uncertain means full verification.** Unsupported pnpm-only declarations, advanced globs, conditional package exports, ambiguities and nonliteral dynamic imports do not produce a falsely confident targeted recommendation.
- Existing CLI commands and JSON `schemaVersion: 1` remain compatible.
- No new runtime dependencies, external model calls, API keys, telemetry or automatic test execution.
- AgentFast is a **file-level heuristic tool**, not a symbol-level graph or compiler-equivalent resolver.
- **No measured time savings or guarantee of seconds-level feedback is claimed.** Suggested test files are for rapid local feedback; run full protected CI for merges and releases.

## Release verification

The existing GitHub release workflow waits for the full Node.js 20/22 cross-platform CI matrix to succeed on `main` before publishing the corresponding immutable GitHub release. Older versions remain available.
