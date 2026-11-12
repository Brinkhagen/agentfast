---
title: AI agents changed your code. Which tests should you run?
published: false
description: A practical, conservative approach to test selection after AI-generated code changes, with a reproducible open-source demo.
tags: testing, typescript, opensource, ai
canonical_url: https://brinkhagen.github.io/agentfast/articles/which-tests-after-ai-code.html
---

# AI agents changed your code. Which tests should you run?

When a coding agent edits a few lines, the feedback loop is awkward: run the entire test suite after every edit, or choose a few nearby tests and risk missing something important.

The problem isn't just speed. It's deciding *when a targeted check is trustworthy enough for fast development feedback* and when the answer should be **run the complete suite**.

I've been building [AgentFast](https://github.com/Brinkhagen/agentfast), a free, MIT-licensed Node.js CLI that explores this decision. It's an early public beta, currently v0.2.0. I'd especially like feedback from people who use Codex, Claude Code or other coding agents with JavaScript/TypeScript projects.

## Why a neighboring test isn't always enough

Consider two changes:

**Case 1: a small isolated source edit.** A module under `src/math.js` changes and a test imports it through a straightforward relative path. We can potentially identify the related test for *quick local feedback*.

**Case 2: an authentication change.** A file under `src/auth/` changes. Even if there is a nearby test, authentication is security-sensitive and there may be interactions the static graph cannot capture. A conservative recommendation is to run the full suite.

In both cases, **all required CI checks still run before merge or deployment**. This isn't a tool for silently dropping mandatory tests.

## What AgentFast does

AgentFast reads Git changes, classifies changed paths and follows supported relative JavaScript/TypeScript imports. It provides:

- A `targeted` recommendation with candidate test files for simple, understood changes.
- A `full` recommendation for auth, billing, migrations, significant config changes, structural changes or incomplete dependency analysis.
- A `none` recommendation when there are no relevant code changes.
- Transparent reason codes and human-readable, JSON or Markdown output.
- Local execution with zero runtime dependencies, no model API key and no telemetry.

It **does not execute your tests**, establish coverage completeness or inspect code semantics like a security scanner.

## Reproduce the two decisions in a disposable repository

If you have Git and Node.js 20+ installed:

```bash
git clone https://github.com/Brinkhagen/agentfast.git
cd agentfast
npm ci
npm run verify
node examples/demo.mjs
```

The demo creates a temporary Git repository, adds a source module and a dependent test, then simulates a focused source edit. Next it changes an authentication-related path to trigger the broader risk policy. The demo removes the temporary files when complete.

For a real repository, install the [v0.2.0 release](https://github.com/Brinkhagen/agentfast/releases/tag/v0.2.0) or run `npm link` from the checkout. Then, in your project:

```bash
agentfast check --base HEAD
agentfast check --base origin/main --format markdown
agentfast check --json
```

If you use GitHub Actions, Markdown can be appended to `$GITHUB_STEP_SUMMARY` as an advisory. The [full example workflow](https://github.com/Brinkhagen/agentfast/blob/main/examples/github-actions-summary.yml) shows the basic idea.

## Why not just use Vitest's changed-test features?

If Vitest's built-in test selection fits your project, you should use it. It's designed for test execution and dependency analysis within Vitest.

AgentFast is experimenting with a *separate, explainable risk-policy layer* that can support general coding-agent workflows. It isn't claiming to outperform Vitest or provide better import resolution.

Today's limitations are significant: TypeScript path aliases, monorepos, many dynamic imports and framework conventions can cause a conservative full-suite fallback. We haven't measured a reproducible speedup or established that the tool is safe in every real-world repository.

## What I'd love you to challenge

I'm looking for developers who can spare **10–15 minutes** to run the disposable demo or test a sanitized change in their own repository.

The most helpful feedback would be:

1. A case where AgentFast recommends too few tests.
2. An unnecessary full-suite fallback that could be resolved safely.
3. An installation problem on Windows, macOS or Linux.
4. A confusing reason code or Markdown output.

**[10-minute beta test guide](https://github.com/Brinkhagen/agentfast/blob/main/docs/BETA-TESTING.md)** · **[Open a feedback issue](https://github.com/Brinkhagen/agentfast/issues/new?template=beta-feedback.yml)** · **[Source code](https://github.com/Brinkhagen/agentfast)**

No signup, paid API or positive review is required. Please don't share credentials or proprietary source in public issues.

*AgentFast is independently maintained by BRINKHAGEN. It is not an official OpenAI, Anthropic, GitHub or Vitest integration.*
