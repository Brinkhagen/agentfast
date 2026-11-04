# AgentFast v0.1.0 — First public beta

AgentFast is a lightweight, MIT-licensed Node.js CLI for **conservative, explainable test planning after Git changes**, including changes made with AI coding agents. It runs locally with zero runtime dependencies, no API key, and no telemetry.

## Included

- Git diff awareness for staged, unstaged, untracked, renamed, and removed files.
- Static JavaScript/TypeScript relative import analysis with candidate test hints.
- Full-suite recommendations for security-sensitive or uncertain changes (authentication, payments, Prisma migrations, CI/config, unresolved imports).
- Human-readable and JSON reports, including a `--fail-on-full` flag.
- `doctor` and `init` helpers, examples, cross-platform CI and security guidance.

## Install this GitHub release

Download `brinkhagen-agentfast-0.1.0.tgz` from the release assets, then in a terminal:

```bash
npm install -g ./brinkhagen-agentfast-0.1.0.tgz
agentfast --help
```

Or clone the source and run `npm ci && npm run verify && npm link`.

> Beta note: AgentFast recommends feedback tests. It does not run test suites automatically, prove test coverage, or replace full protected CI. Always review recommendations and run required verification before merging.

Feedback and reproducible bug reports are welcome: https://github.com/Brinkhagen/agentfast/issues
