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

## v0.4.1 — November 8, 2026

- Reproducible synthetic CLI benchmark scenarios and raw metrics workflow
- Extra alias regression tests for nested paths and import cycles
- Maintainer-controlled npm OIDC workflow prepared; initial registry publication still pending
- React/Astro beta-testing guide and symbol-aware impact RFC

## v0.5.0 — November 8, 2026

- Optional TypeScript AST-based preview of directly changed exported declarations
- Strict JSON-only `--symbol-impact` option, with no effect on conservative test selection
- Safe diagnostics for unsupported syntax and an optional TypeScript integration test workflow

## Proposed next milestones (not shipped)

1. **Validation:** Compare AgentFast recommendations with Vitest's native changed/related test selection on real-world projects; synthetic CLI timings alone are not comparative evidence. See [issue #5](https://github.com/Brinkhagen/agentfast/issues/5).
2. **Distribution:** Authenticate and publish the first npm package release, then configure the manual trusted-publisher workflow.
3. **Stability:** Collect real external beta test evidence, review symbol-level analysis RFC, and define a carefully scoped v1.0.0 milestone.

Each new public release must include the previous versions, change log, tests and checked release notes.

**Still under research:** symbol-accurate dependency propagation and test selection. The v0.5 preview does not claim those capabilities. See [Issue #14](https://github.com/Brinkhagen/agentfast/issues/14).
