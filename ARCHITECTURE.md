# Architecture

AgentFast is a dependency-free Node.js CLI using Git and static source inspection.

- `src/git.js` reads status and changed paths without shell command interpolation.
- `src/analyze.js` classifies changes and builds a conservative local-import graph.
- `src/report.js` formats the advisory result.
- `src/cli.js` exposes check, doctor, init, JSON and exit codes.

Unresolvable imports and high-risk changes trigger a full-test recommendation. No local test-selection algorithm can prove the absence of downstream regressions, so required CI still runs in full before merging.
