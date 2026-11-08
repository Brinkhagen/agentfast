# AgentFast v0.4.1 — Reproducible Benchmarks & Maintainer Workflows

This maintenance release builds on the verified v0.4 Astro / workspace analysis.

## New in v0.4.1
- Seven isolated Git fixtures checking local TypeScript, auth-risk, unresolved imports, package configuration, path aliases, Astro/workspaces, and documentation-only changes.
- Reproducible CLI wall-clock microbenchmarks: raw JSON with median, mean, p95, min/max and environment metadata.
- GitHub Actions benchmark workflow (PR/manual), including raw JSON artifacts and a benchmark summary.
- Additional nested alias and cyclic graph regression tests.
- 10-minute React/Astro external beta guide with privacy instructions and an invitation template.
- Optional, **manual-only** npm trusted-publisher workflow and verified release publishing instructions. npm registry publication **still requires npm account ownership and initial package setup**.
- Symbol-aware impact design document covering safe parser, resolution, side-effect and test-recall requirements.

## Install via GitHub Release

```bash
npm install -g https://github.com/Brinkhagen/agentfast/releases/download/v0.4.1/brinkhagen-agentfast-0.4.1.tgz
agentfast --version
agentfast check --base HEAD --format json
```

## Benchmark

```bash
git clone https://github.com/Brinkhagen/agentfast.git
cd agentfast
npm ci
npm run bench:repro
```

**Interpretation:** Benchmarks measure starting the AgentFast CLI and local Git analysis on **tiny synthetic fixtures**. They do not run test suites, compare against Vitest, measure real production CI, or prove a speedup. See [benchmark methodology](https://github.com/Brinkhagen/agentfast/blob/main/docs/BENCHMARKS.md).

## Compatibility and safety

- The advisory CLI and `schemaVersion: 1` outputs remain compatible with v0.4.0.
- No additional runtime dependencies, API keys, telemetry, external code upload or automated test execution.
- File-level analysis only; symbol-level selection remains research, not shipped.
- Existing required full CI must always run before merge/release.

Publication uses the existing immutable GitHub release workflow only after cross-platform `main` CI succeeds.
