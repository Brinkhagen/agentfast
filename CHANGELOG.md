# Changelog

All notable changes to AgentFast are documented here. Keep old release notes and version tags available so beta testers can reproduce earlier behavior. Versions before 1.0.0 may change interfaces.

## [Unreleased]

### Planned
- Independent validation on real external React/Astro repositories.
- Reproducible benchmark comparisons with framework-native test selection.

## [0.5.0] - 2026-11-08

### Added
- Explicit experimental `--symbol-impact` CLI flag for JSON reports only.
- Optional local TypeScript AST parsing of direct exported JS/TS declarations and Git-base comparisons.
- Report modified, added and removed export declarations, non-export statement changes and parsing uncertainty.
- Dedicated optional-parser integration tests and a Node.js 20/22 GitHub Actions workflow.
- Clear symbol preview documentation and conservative fallback when TypeScript is missing.

### Compatibility and safety
- **No** symbol-aware narrowing of `affectedTests`, which remains based on the established file-level graph.
- Unsupported re-exports, syntax errors and structural changes are reported as inconclusive/partial.
- No mandatory TypeScript runtime dependency, API keys, telemetry or external code upload.
- Prior JSON fields and full required CI safety rules remain unchanged.

## [0.4.1] - 2026-11-08

### Added
- Seven reproducible offline Git fixture scenarios covering test-impact decisions and raw CLI latency (median, p95 and environment data).
- GitHub Actions benchmark workflow with archived unmodified JSON results.
- Nested and cyclic TypeScript alias tests.
- Dedicated npm trusted-publisher workflow (manual-only) and first-publish instructions.
- Privacy-aware React/Astro beta test guide and symbol-aware analysis research specification.

### Notes
- No verified speedup vs Vitest has been established; Issue #5 remains open.
- No external beta results have been confirmed.
- npm registry publishing requires separate ownership, authentication and trusted-publisher setup.
- CLI decisions remain file-level heuristics, with full protected CI required.

## [0.4.0] - 2026-11-08

### Added
- Conservative npm/yarn root-workspace import resolution for explicit local source exports.
- File-level Astro frontmatter and inline script import traversal.
- Reproducible React/Astro monorepo demo and 18 regression tests.
- Detailed supported-pattern and limitation documentation.

### Compatibility and safety
- JSON schema version 1 and existing CLI flags are unchanged.
- No runtime dependencies, remote calls, telemetry or automatic test execution.
- Unsupported workspace globs, pnpm-only declarations, conditional exports and ambiguous targets fall back to broad verification.
- No symbol-level or measured CI speedup claims. Required full CI remains mandatory.

## [0.3.0] - 2026-11-06

### Added
- Root tsconfig.json and jsconfig.json `compilerOptions.paths` resolution for simple exact and single-wildcard aliases.
- JSONC comments and trailing commas supported in configuration.
- Conservative full-test fallback for missing, unsafe, ambiguous, inherited and unsupported alias configurations.
- A portable Codex/Claude Code verification skill and project-level integration instructions (merged earlier).

### Compatibility and safety
- JSON schema remains version 1; existing CLI flags and output formats are unchanged.
- No new dependencies, external API usage, telemetry or automatic test execution.
- Workspace aliases, extends/references, computed imports and advanced bundler resolution remain unsupported; use full required CI.

## [0.2.0] - 2026-11-05

### Added
- New output formats: `--format text`, `--format json`, `--format markdown`.
- GitHub-flavored Markdown risk report for pull requests and GitHub Actions summaries.
- `--output <file>` to create a UTF-8 report without overwriting existing files.
- Example GitHub Actions job summary and agent workflow integration guide.
- Regression tests for Markdown escaping, risk fallback, JSON compatibility, format validation and safe export.

### Changed
- Versioned release automation waits for the successful cross-platform CI workflow before publishing a new version; already published tags are preserved.
- Documented installation, output formats, limitations and next milestones.

### Compatibility
- The legacy `--json` flag still works.
- JSON output remains `schemaVersion: 1`.
- No new runtime dependencies, no API keys, no telemetry.
- AgentFast continues to recommend tests; it does not execute tests or replace required CI.

## [0.1.0] - 2026-11-04

### Added
- Dependency-free Node.js CLI for local change analysis.
- NUL-safe Git diff processing (tracked, untracked, rename, deletion).
- Static JS/TS relative import graph and transitive test-impact suggestions.
- Conservative critical-risk policies for authentication, payments, schema migrations, shared code, and configuration.
- Structured JSON output and CI guard (`--fail-on-full`).
- Doctor and init helpers, security documentation, and automated tests.

Published: https://github.com/Brinkhagen/agentfast/releases/tag/v0.1.0
