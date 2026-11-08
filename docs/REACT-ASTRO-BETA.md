# React / Astro beta verification guide

Thanks for trying AgentFast. **We need real feedback, including failures.** The project is local-first and does not upload your repository or call AI APIs.

## 10-minute external beta test

Requirements: Git, Node.js 20+ and a JavaScript/TypeScript/React/Astro project with normal tests.

1. Install the current [verified release](https://github.com/Brinkhagen/agentfast/releases/latest).
2. Run `agentfast doctor` and confirm it recognizes the repository.
3. Make one ordinary source edit in a temporary branch. Save the outputs of `agentfast check --base HEAD --format json` and `agentfast check --base HEAD --format markdown`.
4. Run the **suggested tests for quick feedback**, then your existing **full required CI**. Compare test files selected with the project team's expected dependency impact.
5. Repeat with one configuration or security-sensitive change, if available; expect a conservative full-suite recommendation.
6. Use [Beta Feedback](https://github.com/Brinkhagen/agentfast/issues/new?template=beta-feedback.yml) for results, bugs, and missed dependencies.

No account, API key, positive review, star or survey is required.

## Helpful feedback

- Tool version and OS/Node/Git versions
- Framework, package manager and test runner
- Whether this is a single package or a workspace/monorepo
- `decision.mode`, `decision.reason`, number of affected files/tests
- Whether the suggestion was correct, overly broad or **missed a test**
- Redacted minimal code fixture if reproducing a bug is practical
- Whether full CI passed after the change

**Privacy:** Do not paste private source files, secrets, environment files, customer data or confidential project paths. Redact repository names, branch names and local paths before posting. The machine-readable output may contain local filesystem paths.

## Scope and warning

AgentFast is **file-level**, not symbol-level. It understands only selected patterns from React/TypeScript imports, Astro frontmatter and root npm/yarn workspaces; complex pnpm, conditional exports and other unknown edges require broad checks. Do not skip full required CI. The project does not promise specific reductions in build duration.

## Sample community reply

> Thanks for taking a look at AgentFast! v0.4 now includes conservative Astro/React workspace analysis and a reproducible demo. If you try it on your next build pipeline, feedback is especially welcome on imports it cannot resolve and any missing tests. Full CI should stay enabled. Here is the beta guide: https://github.com/Brinkhagen/agentfast/blob/main/docs/REACT-ASTRO-BETA.md

This is a suggested response for the maintainer. It has **not** been posted automatically to a third-party social account.
