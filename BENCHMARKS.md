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

## Independent native Vitest selection comparison (controlled fixture)

The repo also contains `benchmarks/vitest-selection.mjs`, exercised by the **Compare AgentFast and Vitest selections** workflow. It installs **Vitest 5.1.0** into a temporary, isolated TypeScript Git fixture, runs the real AgentFast CLI and Vitest `--changed HEAD` against the exact same edits, and saves full JSON results as a GitHub Actions artifact. For the ordinary TypeScript case it also checks `vitest related src/math.ts`.

Reproduce in a trusted checkout with Node.js 22+, Git and npm registry access:

```bash
node benchmarks/vitest-selection.mjs --output vitest-selection-local.json
```

Results verified in the GitHub Actions comparison workflow on November 8, 2026:

| Scenario | AgentFast policy | Vitest 5.1.0 `--changed HEAD` executed |
| --- | --- | --- |
| Simple TypeScript source change | Targeted | `tests/math.test.ts` |
| Authentication/session edit | Full verification | `tests/session.test.ts` |
| Source edit plus unresolved import | Full verification | `tests/math.test.ts` |
| `package.json` configuration edit | Full verification | Both fixture test files |

The normal source case also selects `tests/math.test.ts` with `vitest related`. These observations illustrate **policy differences**, not superior recall or runtime. AgentFast's "full" decision is a *safety recommendation*; Vitest runs real tests. No comparison on proprietary or production-scale repositories has yet been conducted.

## Follow-up research and limitations



Vitest already supports [`--changed`](https://vitest.dev/config/changed) and [`vitest related`](https://vitest.dev/guide/cli). To fairly compare them on the **same real application**:

1. Record the exact Vitest version, runtime version and project configuration.
2. Run the full suite first to establish a baseline.
3. Make the same focused source edit with a documented Git base.
4. Run `agentfast check --base HEAD --format json` and record the file recommendations and reason codes.
5. Run the project's configured Vitest selection, e.g. `vitest run --changed HEAD`, recording **selected/executed test files** and total wall time separately.
6. Compare recall against the test files that could fail because of the change, using an independently verified oracle if available.
7. Repeat for authentication, migrations, unresolved imports, dynamic imports, aliases, and structural changes. Document every false negative and discrepancy.

**Do not** treat AgentFast's conservative `full` recommendation as a test-run failure, or compare its advisory CLI runtime to a Vitest run executing tests. These are different workloads.

The controlled comparison is now automated and reproducible; independent production-scale validation and false-negative reviews remain important future work. No unsupported speedup percentages or "seconds" guarantees are claimed.
