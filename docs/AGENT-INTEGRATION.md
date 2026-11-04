# Coding agent integration

Run `agentfast check --base origin/main --json` to inspect the risk of generated changes. The JSON decision can inform which tests to run for quick local feedback.

- `full`: run your complete relevant suite.
- `targeted`: run suggested tests for rapid feedback, then complete required CI.
- `none`: typically no code tests for docs-only changes; required CI still applies.

The tool does not execute tests itself, access remote models, or upload source code. Never treat a targeted result as proof of correctness.
