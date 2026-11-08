# AgentFast roadmap

AgentFast is a public experimental beta focused on explainable, risk-aware test planning, not replacing required tests.

## Shipped: v0.1.0 — November 4, 2026

- Git-aware diff analysis, including untracked and structural changes
- Static local JS/TS import graph for affected test candidates
- Text and JSON output, plus conservative security/configuration fallback
- GitHub release, CI for Windows, Linux, macOS and CodeQL

## v0.2.0 — November 5, 2026

- GitHub-flavored Markdown output for Pull Requests and Actions summaries
- Safe report export, refusing to overwrite existing files
- Explicit `--format` while preserving the previous `--json` flag
- Example integration workflow and new regression tests
- Version-aware release automation gated on complete CI success

## v0.3.0 — November 6, 2026

- Conservative tsconfig/jsconfig single-wildcard and exact path-alias resolution
- JSONC configuration parsing, ambiguity checks, strict repository boundary enforcement
- Regression coverage for supported and unsupported configurations
- Portable Codex/Claude verification skill released with full CI checks

## v0.4.0 — November 8, 2026

- Static Astro frontmatter and inline-script imports included in the dependency graph
- Conservative npm/yarn workspace package imports with explicit local source entry points
- Reproducible React/Astro workspace demo and new safety regression tests

## Proposed next milestones (not shipped)

1. **Validation:** Publish independently reproducible fixtures and compare recommendations with Vitest's native changed/related test selection. See [issue #5](https://github.com/Brinkhagen/agentfast/issues/5).
2. **Distribution:** Evaluate publishing the package to the public npm registry; currently releases distribute a versioned `.tgz`.
3. **Stability:** External beta testing, API review, safety hardening and a carefully scoped v1.0.0 milestone.

Each new public release must include the previous versions, change log, tests and checked release notes.
