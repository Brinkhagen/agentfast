# Contributing to AgentFast

Thanks for helping make AI-assisted software changes safer and easier to review.

## Before opening a pull request

1. Check existing [issues](https://github.com/Brinkhagen/agentfast/issues) and discussions to avoid duplicate work.
2. For new behavior or potentially breaking decisions, open an issue first and explain the use case.
3. Fork the project and create a focused branch (`fix/`, `docs/`, or `feat/`).
4. Run `npm ci && npm run verify`. AgentFast intentionally uses **zero production dependencies**.
5. Include regression tests for behavior changes, especially any change that could recommend fewer tests.
6. Update docs and `CHANGELOG.md` when user-visible behavior changes.

## Design principles

- **Safe by default.** If analysis is incomplete, require broader checks. Do not suppress security, payment, or schema risk signals to optimize speed.
- **Explainable.** Every recommendation must have a stable reason code.
- **Local-first.** No telemetry, source upload, or API key needed for core functionality.
- **Cross-platform.** Prefer built-in Node.js APIs and argument-based child processes (no shell interpolation).
- **Honest.** Avoid promises of complete dependency coverage or universal speedups.
- **Accessible.** Keep CLI output legible with or without terminal colors.

## Development

```bash
git clone https://github.com/Brinkhagen/agentfast.git
cd agentfast
npm ci
npm run verify
node bin/agentfast.js check --base HEAD
```

## Reporting bugs

Use the GitHub bug-report issue template. Include Node version, Git version, a redacted sample repository structure, and sanitized output from `agentfast check --json`. **Never attach secrets or customer source code without permission.**

## Reporting security issues

See [SECURITY.md](SECURITY.md). Do not post exploitable details in public issues.

## Governance

Initial maintainer: [@Brinkhagen](https://github.com/Brinkhagen). Maintainer decisions prioritize correctness, security, compatibility, and community value. Contributions remain subject to the repository's MIT License.