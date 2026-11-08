# Reproducible AgentFast examples

Run these examples from the root of a Git checkout. They use Node.js 20+ and Git and require no API keys, external services, or proprietary code.

## Two advisory outcomes in one run

```bash
npm ci
npm run demo:workspaces
```

The [generated minimal workspace fixture](demo-workspaces.mjs) creates its own temporary Git repository with a React-style UI component, an Astro page, a matching test file and an authentication-sensitive module. The script **calls the real AgentFast CLI** and confirms:

1. Editing a UI source module recommends **TARGETED** feedback tests, naming the connected test file.
2. Editing an authentication/session source module recommends a **FULL** suite.

The fixture and its Git history are deleted after the run. The script is included in the existing `npm run verify` CI checks and should work on Windows, macOS and Linux. It measures no runtime savings and does not execute selected tests automatically.

## Benchmarks

Run `npm run bench:repro` to create seven temporary Git fixture repositories that assert AgentFast recommendations and record CLI latency. See [benchmark methodology](../docs/BENCHMARKS.md).

**Safety:** Neither a targeted recommendation nor an example can replace full protected CI. Avoid uploading private paths, credentials or source code when reporting test results.
