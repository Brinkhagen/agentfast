# Experimental Symbol Impact Preview — AgentFast v0.5.0

AgentFast can optionally compare **direct top-level exported declarations** between your Git base and your current JavaScript/TypeScript files.

This is an **AST-based experimental preview**. It is useful for code review and exploring a change, but **it does not yet provide symbol-accurate test selection**. The regular file-level test planner remains unchanged.

## Usage

Requirements: Git, Node.js 20+, and a TypeScript compiler installed in the analyzed project (or in a development checkout of AgentFast).

```bash
npm install --save-dev typescript
agentfast check --base HEAD --format json --symbol-impact
```

The `--symbol-impact` flag is intentionally supported **only with JSON output**. This avoids presenting incomplete symbol hints as an authoritative test recommendation.

### Example (simplified)

Suppose a file changed from:

```ts
export const add = (x: number) => x + 1;
export const keep = 42;
```

to:

```ts
export const add = (x: number) => x + 2;
export const keep = 42;
```

The extra `symbolImpact` JSON field looks like:

```json
{
  "status": "preview",
  "parser": "typescript 5.8.3",
  "changes": [{
    "path": "src/core.ts",
    "changedExports": [{"name": "add", "change": "modified"}],
    "nonExportStatementsChanged": false,
    "interpretation": "Direct top-level exported declarations only; not a complete symbol dependency graph"
  }]
}
```

The regular output `decision.mode`, `decision.reason` and `affectedTests` are unchanged.

## Conservative limits

- Only direct top-level `export` declarations in JS/JSX/TS/TSX/MJS/CJS/MTS/CTS are inspected.
- Re-export chains and unsupported export syntax return an explicit diagnostic; they never trigger narrower tests.
- Changes to internal helpers may affect exported functions **even if the changedExports list is empty**. In that case `nonExportStatementsChanged` signals the uncertainty, but **all cases are experimental**.
- Framework transforms, conditional exports, class members, module side effects, import aliases and indirect symbol dependencies are not resolved.
- Deleted/renamed/structurally changed, oversized, unreadable or syntactically invalid files trigger diagnostics.
- If TypeScript is not installed locally, the field has `status: "unavailable"`. AgentFast continues with its established file-level recommendations. There is **no required runtime dependency** for normal operation.
- No network requests, no API keys, no source upload, no automatic test execution.

## Implementation and validation

The implementation uses TypeScript's `createSourceFile` AST parser, comparing export declaration source text between the chosen Git base and current files. It deliberately does **not** feed these hints into the selected-test calculation.

A dedicated [GitHub Actions workflow](../.github/workflows/symbols.yml) installs a pinned TypeScript compiler for tests and verifies the AST preview independently on Node.js 20 and 22. Normal Linux/macOS/Windows CI continues to run without a mandatory TypeScript dependency.

**Full protected CI is still required before merging or releasing.** For any symbol-based test narrowing, the [RFC](SYMBOL-IMPACT-RFC.md) defines additional correctness gates.

## Experimental AST consumer evidence (research only)

When the optional TypeScript parser is installed, `symbolImpact.consumerPreview` also reports possible direct importers and file-level transitive tests for changed *named exported declarations*. Re-export barrels are traversed as **whole files**, never with symbol-level precision. This is a bounded, read-only AST preview; it does not execute a project or contact remote services.

- A direct named import or re-export is matched against the changed original exported name; default imports and wildcard imports are considered potential consumers.
- Transitive results follow the **entire file-level reverse graph** and are intentionally overinclusive.
- Aliases, package imports, computed/dynamic imports, CommonJS, malformed syntax, file limits and unsupported resolution yield explicit diagnostics or inconclusive status. Non-relative import paths are not resolved by this preview.
- Module initialization, side effects, indirect callbacks and framework compilers can affect tests even if the preview lists no candidates. **Empty lists are never evidence of safety.**
- The existing `decision`, `affectedTests`, and `schemaVersion: 1` are unchanged. **Never run only `consumerPreview.possibleTests` or skip existing CI based on this field.**

This adds research evidence; it does not satisfy [symbol-accurate test selection](SYMBOL-IMPACT-RFC.md). Independent recall and false-negative validation are still prerequisites for a future narrowing algorithm.
