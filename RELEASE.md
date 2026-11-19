# AgentFast Release Engineering

**Ship faster. Verify smarter. Release with proof.**

AgentFast uses a public, auditable release calendar. Each milestone is a target, never a promise or a pre-created GitHub Release. New versions are published only when the corresponding implementation exists, has been reviewed and has passed independent verification.

## Public release calendar

| Target (Europe/Berlin) | Version | Theme | Current state |
| --- | --- | --- | --- |
| 19 Nov 2026 | v0.7.0 | AST Evidence | **Released** |
| 27 Nov 2026 · 11:30 CET | v0.7.1 | Quality & Polish | Planned; **optional patch** |
| 11 Dec 2026 · 11:30 CET | v0.8.0 | Deep Analysis | Planned |
| 8 Jan 2027 · 11:30 CET | v0.9.0 | Stability Candidate | Planned |
| 5 Feb 2027 · 11:30 CET | v1.0.0 | Stable Milestone | Planned, subject to acceptance |

These dates are provisional. A version will be delayed or omitted if it is not ready. Security fixes may be prepared for an earlier reviewed release window. Never publish an empty update to create the appearance of activity.

The single source of truth is [config/release-calendar.json](../config/release-calendar.json). The GitHub Actions scheduler wakes daily at **10:37 UTC**, which is **11:37 CET** on the listed winter target dates; the ten-to-thirty-minute margin helps with GitHub's best-effort scheduling. Actual publication time can be delayed; the calendar gate will not publish before the target UTC instant.

## How to prepare and approve a release

1. Implement the planned behavior with focused, realistic regression tests. Keep the current working release downloadable.
2. Conduct code review, full Node.js 20/22 CI on Linux/macOS/Windows, CodeQL, optional TypeScript AST tests where appropriate, and benchmark or comparison checks when changed.
3. Verify documentation, compatibility, security and real external evidence. In particular, the proposed v1.0.0 milestone requires real independent beta reports and no unaddressed high-severity correctness regressions; **do not claim symbol-accurate test exclusion** without verified recall and supported resolution.
4. Create a reviewed version-bump PR updating package.json, package-lock.json, CHANGELOG.md, README.md and a nonempty .github/RELEASE_NOTES_vX.Y.Z.md. Preserve old release tags and downloads.
5. In a separate reviewable approval step, change **only the ready version** from "planned" to "approved" in the JSON calendar. Never approve two versions at once. This is explicit publication authorization.
6. The scheduled workflow (or manual "Run workflow") will first verify the UTC target time, exact source and lockfile version, notes, the current main SHA, and successful **push-triggered CI and CodeQL for that exact SHA**. It reruns the test suite and package dry-run before publishing.
7. Once published, mark its calendar status "released" with the actual GitHub publication timestamp, and move on to the next milestone. Already-published immutable releases are never rewritten.

**Manual workflow dispatch cannot bypass approval or the release date.** A genuinely urgent patch can be proposed with an earlier target timestamp in a reviewed PR and then dispatched after the required checks pass. GitHub can delay scheduled runs; this is not a time-precise delivery service. For GitHub scheduled workflows in inactive public repositories, the schedule may be disabled after 60 days of inactivity: maintainers should check the Actions status before relying on a release window.

## Publishing and distribution are separate

Publishing a GitHub Release does **not** publish to npm. The initial npm package requires the legitimate owner of the @brinkhagen scope to authenticate and authorize first publication, then configure the exact GitHub Actions trusted publisher. See [NPM-PUBLISHING.md](NPM-PUBLISHING.md). Until independently confirmed, the registry status remains "pending."

## Release-quality rubric

| Gate | Ready when |
| --- | --- |
| Correctness | Regression tests and realistic failure-mode fixtures pass |
| Safety | Unresolved imports, risky changes and side effects still trigger conservative recommendations |
| CI | Full cross-platform matrix **and** CodeQL successful for the intended main commit |
| Compatibility | CLI flags and schema behavior checked against supported versions |
| Documentation | Changelog, examples, support status and known limitations updated |
| Evidence | Benchmarks and beta results are real, reproducible and clearly qualified |
| Distribution | Versioned package archive exists; npm is only claimed if registry verifies it |
| Approval | Maintainer explicitly changes the calendar status to approved in a reviewed PR |

## History and trust

Previous [GitHub Releases](https://github.com/Brinkhagen/agentfast/releases) and their original dates remain public. Release dates are actual GitHub publication timestamps, not backdated. A missed milestone is documented as delayed, not silently fabricated.

## Links

- [Engineering roadmap](ROADMAP.md)
- [Cross-platform CI](https://github.com/Brinkhagen/agentfast/actions/workflows/ci.yml)
- [Scheduled release automation](https://github.com/Brinkhagen/agentfast/actions/workflows/release.yml)
- [Real beta-test protocol](REACT-ASTRO-BETA.md)
- [Safe npm publishing](NPM-PUBLISHING.md)
