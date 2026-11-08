# Reproducible AgentFast benchmarks

This project now ships an **offline microbenchmark** that exercises the real CLI against seven short-lived Git fixture repositories. It is intended to detect regressions in recommendation behavior and report raw latency observations, **not** to prove a performance advantage.

## Run locally

Requires Node.js 20+ and Git:

```bash
npm ci
npm run verify
npm run bench:repro
npm run bench:repro -- --output ./agentfast-benchmark-local.json
```

The JSON output contains per-fixture decision expectations, number of iterations, min/median/mean/p95/max elapsed CLI wall time, platform, Node and Git versions. The benchmark generates local Git histories and temporary source files and deletes them afterward. Set `AGENTFAST_BENCH_ITERATIONS=20` to increase repetitions (3–50).

The GitHub Actions workflow **Reproducible CLI benchmark** runs on applicable pull requests or manually and archives the raw JSON as an artifact with a summary of measured results.

## Scenarios and assertions

| Fixture | Expected recommendation |
| --- | --- |
| Ordinary TypeScript module import | targeted |
| Authentication/session change | full |
| Unresolved local import elsewhere in the graph | full |
| Package configuration change | full |
| Simple tsconfig alias | targeted |
| Explicit npm/yarn workspace used by an Astro/React app | targeted |
| Documentation-only modification | none |

**Definitions:** Measured latency includes starting Node, invoking Git, scanning fixture files and emitting JSON. It excludes running any tests. Tiny synthetic fixtures do not reflect the scale of a production monorepo or real CI jobs. Results vary across hosts and caches. There is no independent performance comparison in these numbers.

## Independent comparison with Vitest (research in Issue #5)

Vitest already supports [`--changed`](https://vitest.dev/config/changed) and [`vitest related`](https://vitest.dev/guide/cli). To fairly compare them on the **same real application**:

1. Record the exact Vitest version, runtime version and project configuration.
2. Run the full suite first to establish a baseline.
3. Make the same focused source edit with a documented Git base.
4. Run `agentfast check --base HEAD --format json` and record the file recommendations and reason codes.
5. Run the project's configured Vitest selection, e.g. `vitest run --changed HEAD`, recording **selected/executed test files** and total wall time separately.
6. Compare recall against the test files that could fail because of the change, using an independently verified oracle if available.
7. Repeat for authentication, migrations, unresolved imports, dynamic imports, aliases, and structural changes. Document every false negative and discrepancy.

**Do not** treat AgentFast's conservative `full` recommendation as a test-run failure, or compare its advisory CLI runtime to a Vitest run executing tests. These are different workloads.

Until those independent Vitest runs have been made and audited, [Issue #5](https://github.com/Brinkhagen/agentfast/issues/5) remains open. No unsupported speedup percentages or "seconds" guarantees are claimed.
