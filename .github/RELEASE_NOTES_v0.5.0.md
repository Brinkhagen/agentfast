# AgentFast v0.5.0 — Experimental AST symbol insights

AgentFast v0.5 adds an **explicitly opt-in** preview for exported symbol changes in JavaScript/TypeScript files, while maintaining the established conservative test-selection policy.

## New functionality

- `agentfast check --format json --symbol-impact`: compares direct top-level exported declarations against a Git base using TypeScript's syntax-tree parser.
- Reports added, removed and modified export declarations and whether non-export statements changed.
- Emits clear diagnostics for re-exports, malformed syntax, unavailable TypeScript, file limits and structural changes.
- Uses TypeScript **only when installed locally** in the analyzed project or AgentFast development checkout; normal CLI operation has zero required runtime dependencies.
- Dedicated Node.js 20/22 AST test workflow plus regression tests prove test-selection results do not change when the preview is enabled.
- [Technical guide and examples](https://github.com/Brinkhagen/agentfast/blob/main/docs/SYMBOL-PREVIEW.md).

## Try it

```bash
npm install -g https://github.com/Brinkhagen/agentfast/releases/download/v0.5.0/brinkhagen-agentfast-0.5.0.tgz
# Inside the JS/TS project being analyzed:
npm install --save-dev typescript
agentfast check --base HEAD --format json --symbol-impact
```

`--symbol-impact` deliberately requires JSON output.

## Critical limits

**This is not symbol-accurate test selection.** The feature only reports direct export-declaration differences. Internal helpers, side effects, re-export chains and framework transformations can affect symbols indirectly. The existing `affectedTests` result is not narrowed or replaced by symbol hints. Full protected CI remains mandatory.

No external model/API calls, no telemetry, no source upload, no test execution. Existing commands remain compatible with `schemaVersion: 1`. The npm registry release remains a separate account-authorized process. Older GitHub releases stay available.
