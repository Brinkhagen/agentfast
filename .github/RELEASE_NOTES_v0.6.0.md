# AgentFast v0.6.0 — Safe pnpm workspace detection

This release extends AgentFast's conservative JavaScript/TypeScript change-impact advisory to **simple pnpm workspaces**.

## New in v0.6.0

- Recognize basic `pnpm-workspace.yaml` lists under a root `packages:` key.
- Resolve local package imports through explicit package exports and local source entry points, just as for supported npm/yarn workspaces.
- Recognize simple patterns such as `packages/*` or `apps/*`, including single/double quotes, comments, and CRLF line endings.
- Reject recursive and exclusion globs, extra YAML keys, advanced YAML constructs and conflicting `package.json` / pnpm declarations with **full-suite fallback**.
- Classify changes to `pnpm-workspace.yaml` as high-risk configuration changes.
- Add seven pnpm regression scenarios and a reproducible real-Git CLI demo, included in `npm run verify`.

## Run the new demo

```bash
npm ci
npm run verify
npm run demo:pnpm
```

The demo confirms a local UI-package change can select the consumer app's test for fast feedback; malformed workspace configuration forces full verification.

## Install from the GitHub release

```bash
npm install -g https://github.com/Brinkhagen/agentfast/releases/download/v0.6.0/brinkhagen-agentfast-0.6.0.tgz
agentfast --version
agentfast check --base HEAD --format json
```

[Complete supported-pattern guide](https://github.com/Brinkhagen/agentfast/blob/main/docs/PNPM-WORKSPACES.md).

## Safety and compatibility

The analyzer supports only a clearly defined YAML subset, not arbitrary pnpm workspace features. Unknown configurations fall back to full verification; this is neither a complete pnpm resolver nor symbol-accurate test selection. Existing CLI flags and `schemaVersion: 1` remain compatible.

Zero required runtime dependencies; no external APIs, telemetry, credentials or automatic test execution. `--symbol-impact` remains a separate, optional experimental export declaration report. Full protected CI remains mandatory for merging or releasing.

The npm registry is **not** automatically published by this GitHub release; npm account ownership and trusted-publisher setup remain a separate step.
