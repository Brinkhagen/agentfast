# AgentFast v0.2.0 — Markdown reports and safer export

AgentFast v0.2.0 makes risk recommendations easier to share with a pull request or GitHub Actions job summary. It remains a local-first, MIT-licensed experimental CLI for Node.js 20+.

## What's new

- **Markdown output:** `agentfast check --base HEAD --format markdown`
- **Safe file export:** `agentfast check --format markdown --output report.md`, which refuses to overwrite existing files.
- **Flexible formats:** `--format text|json|markdown` while keeping the original `--json` option.
- **CI integration:** [Example workflow](https://github.com/Brinkhagen/agentfast/blob/main/examples/github-actions-summary.yml) can generate a GitHub Actions summary.
- **Regression coverage:** seven new automated tests, including escaping unsafe Markdown paths, full-suite recommendations, CLI compatibility and output handling.
- **Release protection:** new releases require successful cross-platform CI before automated publication.

## Install from GitHub Releases

```bash
npm install -g https://github.com/Brinkhagen/agentfast/releases/download/v0.2.0/brinkhagen-agentfast-0.2.0.tgz
agentfast --version
agentfast check --format markdown
```

Or clone the repository, run `npm ci && npm run verify`, then `npm link`.

**Compatibility:** `schemaVersion: 1`, no new runtime dependencies and existing `--json` behavior unchanged.

**Safety:** AgentFast provides recommendations; it does not run tests or prove coverage completeness. Always run required CI before merging or releasing. No performance improvements or real external adoption are claimed.

[Full changelog](https://github.com/Brinkhagen/agentfast/blob/main/CHANGELOG.md) · [Report a bug](https://github.com/Brinkhagen/agentfast/issues/new/choose)
