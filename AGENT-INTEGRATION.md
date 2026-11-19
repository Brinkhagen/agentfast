# Coding-agent and CI integration

AgentFast is **an advisory**, not an automatic test runner or official extension of Codex, Claude Code, GitHub, Vitest or Jest. It reads local Git changes and suggests quick feedback tests only for sufficiently understood changes.

## Commands (v0.4.0)

Run from a Git repository after installing AgentFast:

- Human-readable: `agentfast check --base HEAD`
- JSON for integrations: `agentfast check --base origin/main --json`
- Equivalent JSON: `agentfast check --format json`
- Markdown for PRs or CI: `agentfast check --format markdown`
- Save a **new** report: `agentfast check --format markdown --output risk-report.md`
- Fail a policy/advisory step when full tests are recommended: `agentfast check --fail-on-full` (exit code 2).

**Important:** `--output` deliberately refuses to overwrite an existing file. To update a report, delete or rename the old output first. When used in an Actions summary, prefer redirection as shown below.

## GitHub Actions job summary

After checkout with complete history (`fetch-depth: 0`) and installation of the versioned GitHub release:

```bash
git fetch origin main
agentfast check --base origin/main --format markdown >> "$GITHUB_STEP_SUMMARY"
```

See the full [example workflow](../examples/github-actions-summary.yml). It is a reference to adapt, not a prepackaged GitHub Action.

For pull requests from forks, consider whether your checkout, base ref and required secrets are appropriate for your CI security policy. **Do not grant write permissions or expose secrets solely to generate an advisory**.

## How to interpret the decision

| Mode | Use |
| --- | --- |
| `full` | Run complete relevant verification; code/config risk or uncertainty was detected. |
| `targeted` | Run suggested test files for **local feedback** and all required CI before merging. |
| `none` | No code tests advised for an empty or docs-only diff; keep required CI. |

The import graph is heuristic. Advanced path aliases, pnpm-only workspaces, conditional exports, dynamic imports and unfamiliar file types can require broader testing, and the tool does not guarantee test completeness.

## Codex / Claude Code workflow

1. Let your coding agent make a focused change in a local Git project.
2. Run `agentfast check --base HEAD --json` from the project root.
3. Inspect reason codes, risks, changed files and affected tests.
4. If targeted, use suggested tests for fast feedback. If full, run the full relevant suite.
5. **Always** run required protected CI gates before merging or deploying.

The JSON schema remains `schemaVersion: 1` in v0.2.0. AgentFast does not execute tests itself or send source to a model/API.
