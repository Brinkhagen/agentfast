# AgentFast v0.7.0 — Experimental symbol consumer hints

This release adds bounded, optional research evidence for possible consumers of changed exported symbols. It **does not** introduce symbol-accurate test selection.

## Added
- Optional `symbolImpact.consumerPreview` with direct named/default imports and conservative file-level transitive candidates, including re-export barrels.
- Inconclusive/partial diagnostics for aliases, dynamic imports, CommonJS, source size limits and unsupported resolution.
- Regression tests for imports, barrels, cycles, unknown edges and missing TypeScript compiler.
- Safer manual npm OIDC workflow, current GitHub Actions and immutable-version preflight.

## Try the optional preview

```bash
npm install -g https://github.com/Brinkhagen/agentfast/releases/download/v0.7.0/brinkhagen-agentfast-0.7.0.tgz
# In the JS/TS project to analyze, install TypeScript if needed
npm install --save-dev typescript
agentfast check --base HEAD --format json --symbol-impact
```

**Critical:** This preview cannot prove which tests are safe to omit. All current `affectedTests` and `decision` recommendations are unchanged; full protected CI is still required. No new mandatory dependencies, hosted API, telemetry, or automatic test execution. `schemaVersion: 1` remains stable.

npmjs.com publication remains unverified until the legitimate scope owner performs first publication and trusted-publisher authorization. No external beta adoption or symbol-level recall claims are made.
