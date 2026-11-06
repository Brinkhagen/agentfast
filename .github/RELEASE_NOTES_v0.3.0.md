# AgentFast v0.3.0 — Safer path-alias analysis

**Ship faster. Verify smarter.** This release expands conservative change-impact analysis in TypeScript and JavaScript projects using simple path aliases.

## What's new

- Follow exact and single-wildcard `compilerOptions.paths` mappings in root `tsconfig.json` and `jsconfig.json`.
- Support JSONC comments and trailing commas in the supported configuration.
- Resolve aliased imports to local test dependencies when the target is unambiguous.
- Preserve full-suite recommendations on unsupported inherited configs, ambiguous mappings, missing imports, repository escapes and other uncertainty.
- Include the portable Codex / Claude Code verification skill added in PR #6.
- New regression tests cover safe and unsafe alias scenarios.

## Install

**Requirements:** Node.js 20+ and Git.

```bash
npm install -g https://github.com/Brinkhagen/agentfast/releases/download/v0.3.0/brinkhagen-agentfast-0.3.0.tgz
agentfast --version
agentfast check --base HEAD
```

## Important

- `--json`, `--format markdown`, `--fail-on-full` and `schemaVersion: 1` remain compatible.
- No remote API calls, telemetry, API keys or new runtime dependencies.
- The tool suggests fast feedback tests, but **never** substitutes for full protected CI.
- Advanced path mappings, `extends` chains, monorepo references, TS compiler resolution and framework-specific imports still require broader verification.

## Verification

The release workflow publishes this version **only after** successful cross-platform CI for Windows, macOS and Linux, Node.js 20/22, and a consistent lockfile version. Historic releases remain available.

Full changelog: [CHANGELOG.md](https://github.com/Brinkhagen/agentfast/blob/main/CHANGELOG.md).
