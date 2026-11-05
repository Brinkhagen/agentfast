# AgentFast — public launch kit

**Version:** v0.2.0 public beta · **Maintainer:** [BRINKHAGEN](https://github.com/Brinkhagen) · **License:** MIT

This is the official, ready-to-use communications kit for an **existing, working beta**, not a claim of widespread adoption or measurable speedups.

- **Code and docs:** https://github.com/Brinkhagen/agentfast
- **Versioned release:** https://github.com/Brinkhagen/agentfast/releases/tag/v0.2.0
- **Issue tracker:** https://github.com/Brinkhagen/agentfast/issues
- **CI:** https://github.com/Brinkhagen/agentfast/actions/workflows/ci.yml
- **Visuals:** [Hero SVG](assets/agentfast-hero.svg) · [Wordmark SVG](assets/agentfast-wordmark.svg) · [Targeted advice](assets/cli-targeted.svg) · [Full-suite advice](assets/cli-full.svg)

> **Accuracy note:** AgentFast recommends test scope. It does **not** automatically run suites, independently prove coverage or guarantee reduced cost/time. Complete protected CI stays mandatory. Node.js 20+ and Git are required. There is no published npm registry package as of this kit; the GitHub release contains an installable `.tgz`.

## Live outreach assets (November 2026)

- [Official v0.2.0 release](https://github.com/Brinkhagen/agentfast/releases/tag/v0.2.0) — available for anyone to install.
- [10-minute beta guide](BETA-TESTING.md) and [feedback template](https://github.com/Brinkhagen/agentfast/issues/new?template=beta-feedback.yml) — real tester onboarding.
- [Published technical article source](articles/which-tests-after-ai-code.html) and [GitHub Pages article URL](https://brinkhagen.github.io/agentfast/articles/which-tests-after-ai-code.html).
- [Full DEV Community article draft](launch/dev-community-article.md) and [RSS feed](feed.xml) for optional DEV cross-post import. The DEV post is not published without an authorized DEV account.
- [GitHub Pages beta CTA](index.html) and visible CLI examples.
- [Official Show HN guidelines](https://news.ycombinator.com/showhn.html) — submit the actual repository URL, not only a blog post, and be available to discuss.

**Publishing status:** GitHub-hosted source, article and launch assets are committed. Reddit, Hacker News and DEV require account login/authorization; these external posts have not been submitted from this repository. Do not present draft copy as a published social post.

**Honest adoption evidence:** GitHub Actions clones are not confirmed real users; the first observed 1 star was the maintainer's own. Track independent issues, clean-install results, referred visitors and versioned release downloads separately.

## Positioning

**Name:** AgentFast  
**Tagline:** Ship faster. Verify smarter.  
**GitHub description:** Conservative, explainable test planning for AI-assisted code changes.  
**One-line pitch:** Git-aware test recommendations for Codex, Claude Code and human developers — local-first, API-key-free and conservative around risk.

**Who it's for:** Node/TypeScript developers, maintainers and teams that use coding agents but still need an auditable, human-reviewed verification workflow.

**What makes it different:** It does not pretend that running fewer tests is automatically safe. It reports *why* it recommends targeted feedback or a full suite and takes a conservative fallback when a dependency graph is incomplete or sensitive paths change.

**Live GitHub topics:** `ai-coding`, `claude-code`, `cli`, `codex`, `coding-agents`, `developer-tools`, `git-diff`, `local-first`, `nodejs`, `test-impact-analysis`, `test-selection`, `typescript`.  
Topics and About metadata must be applied through repository settings by someone with appropriate permissions; these aren't set by a Markdown file.

## Launch channels (drafts — publish only after checking each community's rules)

### Hacker News / Show HN

**Title:** Show HN: AgentFast – conservative test planning for AI-generated code changes

**Text:**

> I built AgentFast, a small MIT-licensed Node.js CLI, because using coding agents made me want faster local feedback *without* blindly skipping important tests.
>
> It reads Git changes, walks straightforward local JS/TS imports and suggests related tests when the analysis is sufficiently clear. When auth, billing, Prisma migrations, CI config or unresolved imports are involved, it recommends the full suite instead.
>
> It runs locally, has zero runtime dependencies, needs no LLM key and provides both CLI and JSON reports. It doesn't execute test suites and I still recommend full protected CI before merging.
>
> Try: `git clone https://github.com/Brinkhagen/agentfast && cd agentfast && npm ci && npm run verify && npm link`, then `agentfast check --base HEAD` from another Git repository.
>
> I'd love feedback on false-positive/full-suite decisions, missed dependency edges and which frameworks you'd want supported next.
>
> https://github.com/Brinkhagen/agentfast

**Submission tip:** Show a public, usable repository rather than asking for upvotes. Avoid scheduling a coordinated voting campaign.

### Reddit — r/codex / r/ClaudeAI (check self-promotion rules first)

**Title:** I built a free CLI to help decide when coding-agent changes need a full test suite

**Text:**

> I use AI coding tools and got tired of a recurring tradeoff: run everything after every small edit, or trust a quick targeted test run too much.
>
> I've released **AgentFast v0.2.0**, an MIT-licensed, zero-runtime-dependency Node.js CLI. It analyzes Git changes and local JS/TS imports, recommends related tests for simple changes, and **defaults to full testing** for things like auth, payment code, Prisma migrations, CI config or incomplete dependency analysis.
>
> No API key, no telemetry, and no automatic skipping of your existing CI. The JSON output is meant to be easy to use alongside Codex/Claude workflows.
>
> Repo + reproducible demo: https://github.com/Brinkhagen/agentfast
>
> Early beta, so I particularly want criticism: where might this be too conservative, or *not conservative enough*?

**Moderation note:** Post only where project showcases are allowed; disclose that you are the maintainer, and do not cross-post identical promotions repeatedly.

### DEV Community — technical article

**Title:** AgentFast: why test selection for AI-generated code should fail safe

When a coding agent changes one small file, running a massive test suite for local feedback can feel wasteful. But optimistically choosing only a handful of tests is not always safe. Authentication, billing, migration, shared configuration and uncertain dependencies deserve broader verification.

AgentFast is a new MIT-licensed Node.js CLI that reads Git changes, examines straightforward relative JavaScript/TypeScript imports and produces an explainable recommendation: targeted feedback for simple, understood changes, or a full test suite when risk or uncertainty is elevated.

```bash
git clone https://github.com/Brinkhagen/agentfast.git
cd agentfast
npm ci
npm run verify
npm link
# Now switch to a Git repository you want to inspect:
agentfast check --base HEAD
agentfast check --json
```

The tool is local-first, needs no LLM API key and does not send source code to a remote model. It is deliberately an **advisory**, not a test runner. It cannot establish coverage completeness and does not replace full CI.

Why not just use Vitest `--changed`? That built-in feature is useful, and you should keep using it where it fits. AgentFast adds a transparent risk policy and a tool-agnostic JSON signal; it is not claiming better dependency resolution than Vitest.

This is a small public beta, not a benchmark victory. I'm looking for practical bug reports, reproducible repositories and people willing to challenge the conservative rules. [Read the code and open an issue](https://github.com/Brinkhagen/agentfast).

### LinkedIn / professional networks

AI coding agents can help write changes quickly. Deciding **how to verify** those changes still needs human judgment.

We've open-sourced **AgentFast v0.2.0**, a local CLI that inspects Git changes and offers explainable, conservative test-planning advice. It suggests focused feedback for ordinary changes and broad testing for risky or uncertain ones.

MIT-licensed · Node.js 20+ · no API key · zero runtime dependencies.

We welcome technical feedback, bug reports and open-source contributors:
https://github.com/Brinkhagen/agentfast

#OpenSource #DeveloperTools #TypeScript #CI #AICoding

### Short-form post

Shipped AgentFast v0.2.0 ⚡

A free, local CLI for conservative test planning after Codex/Claude-assisted code changes.

Simple change → suggest related tests. Risky/unclear change → recommend full CI.

MIT · Node 20+ · no API key · no telemetry.

Repo: https://github.com/Brinkhagen/agentfast

## 45-second demo plan

1. Show `node examples/demo.mjs` and its two contrasting outcomes.
2. Display [targeted](assets/cli-targeted.svg) versus [full-suite](assets/cli-full.svg) visuals.
3. Show `agentfast check --json` and point to the reason code.
4. State clearly: “This is advice for local feedback. Required CI still runs in full.”
5. End with the repository link and invitation to report missed cases.

Use actual terminal output when recording; do **not** present an illustrative SVG as a screen recording or publish invented performance metrics.

## Frequently asked questions

**Is this another LLM wrapper?** No. Version 0.2.0 is a deterministic, local CLI; no API account is needed.

**Does it automatically execute only safe tests?** No. It recommends scope; the developer or CI decides what to run.

**Can it miss dependencies?** Yes. Its import analysis is heuristic and intentionally falls back to full testing when uncertainty is detected. Some unsupported alias/workspace patterns remain a known limitation.

**Does it guarantee fewer tokens or a faster workflow?** No measurable guarantee yet. Reproducible benchmarks are a roadmap item.

**Can I contribute?** Yes. See [CONTRIBUTING.md](../CONTRIBUTING.md), [architecture limitations](ARCHITECTURE.md) and the [issue tracker](https://github.com/Brinkhagen/agentfast/issues).

## Ethical promotion plan

**First:** verify the public release links, run the demo, confirm GitHub CI, and obtain at least one clean third-party installation.

**Then:** choose one community that allows project demos. Ask for technical criticism, not stars or votes. Publish a follow-up with real findings and fixes only after contributors have had time to try it.

**Measure separately:** unique GitHub visitors (14-day traffic view), actual release asset downloads, npm downloads only after npm publication, reproducible bug reports, external pull requests and downstream use. Do not combine these into a fictional “users” count.

**Never:** buy stars, use bot accounts to create installs, fabricate screenshots/test results, artificially inflate download numbers, or ask for vote brigades.

## Support and disclosure

Independent BRINKHAGEN open-source project. Not affiliated with or endorsed by OpenAI, Anthropic, GitHub or the maintainers of referenced test frameworks. Do not use brand logos or names in a way that implies an official partnership.
