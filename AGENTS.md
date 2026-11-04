# Agent instructions (Codex, Claude Code, other assistants)

1. Understand README.md and docs/ARCHITECTURE.md before modifying test-selection logic.
2. Prioritize conservative behavior: any uncertain or high-risk change should recommend a full suite.
3. Never run or evaluate untrusted repository source as part of static analysis.
4. Run `npm run verify` after any code change. Update test fixtures for behavior changes.
5. Keep CLI output backward compatible where practical; JSON schema has a version field.
6. Do not claim npm distribution, GitHub release, usage statistics, security certification, or funding approval unless independently confirmed.
7. Do not use fake users, stars, or download metrics to market the project.
8. Never print or commit secrets; use synthetic data in tests.