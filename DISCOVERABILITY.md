# GitHub discovery and repository positioning

**Project:** [AgentFast](https://github.com/Brinkhagen/agentfast) · **Publisher:** BRINKHAGEN · **Release:** v0.1.0 public beta

This is the authoritative public-facing metadata and promotion guide for AgentFast. It documents recommendations but **does not apply settings in the GitHub About panel**: the repository owner must change those settings with an administration-capable GitHub client.

## Recommended GitHub About metadata

**Short description (ready to use):**

> Explainable Git-diff test recommendations for Codex, Claude Code and TypeScript projects. Risk-aware, local-first, no API key.

**Homepage (only after GitHub Pages is enabled and resolves):**

> https://brinkhagen.github.io/agentfast/

**Recommended GitHub topics (12, ordered by relevance):**

`test-selection`, `test-impact-analysis`, `ai-coding`, `coding-agents`, `claude-code`, `codex`, `developer-tools`, `typescript`, `nodejs`, `git-diff`, `cli`, `local-first`.

**Why these topics?**

| Topic | What it communicates |
| --- | --- |
| `test-selection` / `test-impact-analysis` | The actual problem: which tests to consider after a change |
| `ai-coding` / `coding-agents` | The intended coding-agent workflow without claiming official integrations |
| `claude-code` / `codex` | Discoverability for developers using those tools; AgentFast is independent |
| `developer-tools` | Broad developer audience |
| `typescript` / `nodejs` | The implementation ecosystem and current analysis focus |
| `git-diff` / `cli` | The product interface and data source |
| `local-first` | No remote code upload or model API key required |

**Avoid misleading classifications:** No `github-action` until we actually ship a reusable action; no `vitest-plugin` / `jest-plugin` because AgentFast is not either; no `official-openai`; no claims of certified security or performance speedups.

## What the current public beta does

AgentFast reads Git changes, performs heuristic JS/TS relative-import analysis, and offers explainable test-scope recommendations. It conservatively recommends full suites for sensitive or unresolved changes. It does **not** execute tests, prove coverage, or replace protected full CI. It does not depend on an API key or a remote model. See the [README](../README.md) and [architecture](ARCHITECTURE.md).

## Where discoverability comes from

GitHub's searchable Topics are distinct from README keywords. Both matter: the About description and topics help categorize the repo, while the README helps a developer understand it and decide to try it. GitHub Pages can provide a second entry point when explicitly enabled.

**Next verifiable signals:** an external clean-install report; a reproducible issue; a third-party repo integrating the advisory output; actual release downloads over a stated period; independent code contributions. Never count personal test downloads as confirmed users.

## Repository settings: current scope

Some settings are outside the connected file-write integration. This file is not evidence they were applied.

- The recommended About text and topics require GitHub repository metadata edit permissions.
- GitHub Pages requires GitHub's Pages source configuration. A `gh-pages` branch being present is not by itself proof that the site is live.
- Social preview requires a supported image upload in GitHub's settings.

## Launch material

- [Community launch copy](LAUNCH-KIT.md)
- [Responsible adoption plan](GROWTH.md)
- [Maintainer policy](../MAINTAINERS.md)
- [Release v0.1.0](https://github.com/Brinkhagen/agentfast/releases/tag/v0.1.0)

**Disclaimer:** Independent MIT-licensed project by BRINKHAGEN. Not affiliated with or endorsed by OpenAI, Anthropic, GitHub, Vitest or Jest.
