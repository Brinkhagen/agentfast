# Changelog

All notable changes to AgentFast are documented here. Keep old release notes and version tags available so beta testers can reproduce earlier behavior. Versions before 1.0.0 may change interfaces.

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

## [Unreleased]

### Planned
- Better monorepo/workspace and test-framework interoperability.
- Reproducible independent benchmarks measuring test-selection recall.

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
