# Beta testing AgentFast v0.1.0

AgentFast is a public, MIT-licensed **early beta**. We're looking for developers who regularly use Git, Node.js, TypeScript/JavaScript and AI coding tools. **No account, paid API, email signup or telemetry is required.**

**Time needed:** roughly 10–15 minutes for a first impression. Feedback can be anonymous to the public except for your GitHub username if you choose to open an issue.

## Install and verify

**Requirements:** Git and Node.js 20+ on Windows, macOS or Linux.

```bash
git clone https://github.com/Brinkhagen/agentfast.git
cd agentfast
npm ci
npm run verify
npm link
```

You can instead download the package from [v0.1.0 GitHub Releases](https://github.com/Brinkhagen/agentfast/releases/tag/v0.1.0) if you prefer. The tool is **not** yet available on the npm public registry. No token or credentials are required.

## 3 specific tests we need

1. **Basic experience.** Run `agentfast --help`, `agentfast doctor` and `node examples/demo.mjs`. Is the setup understandable? Does anything fail on your platform?
2. **Real change, sanitized feedback.** In an existing local Git repository, from its root run `agentfast check --base HEAD` and `agentfast check --json` after making a small change. Does the recommendation make sense? *Never paste private source, credentials or raw sensitive file paths into a public issue.*
3. **Risk classification.** If you have a suitable disposable test repository, add or modify an authentication-related file, then rerun the CLI. Is the full-suite recommendation understandable? Are the reason codes useful?

The main question is **what did AgentFast get wrong or make confusing?** Please call out overly strict recommendations as well as any possible dangerous underestimation of risk.

## Report your result

Use [Beta feedback issue template](https://github.com/Brinkhagen/agentfast/issues/new?template=beta-feedback.yml) to report your environment, outcome and any reproducible problem. Existing bugs can also use the [bug report template](https://github.com/Brinkhagen/agentfast/issues/new/choose).

You can also reply in the community thread that brought you here. Please do **not** feel pressured to star the project, leave a positive review or share any identifying data.

## Scope and safety

This tool provides **advisory test planning**. It does not execute tests, guarantee complete test selection or replace full CI. Static import analysis is currently heuristic. If in doubt, run all required tests.

We do not claim verified external adoption or performance savings until independently measured. For internals see [architecture and limitations](ARCHITECTURE.md).
