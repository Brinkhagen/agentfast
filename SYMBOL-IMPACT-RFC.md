# RFC: symbol-aware test impact (research, not shipped)

**Status: design only.** AgentFast v0.4.x uses file-level dependency analysis; no public release claims to identify changed symbols precisely.

## Why the current file graph is insufficient

A change in an exported component may trigger every test importing the same file even if those tests use different exports. Conversely, TS path aliases, re-exports, `export *`, namespace imports, decorators, type erasure and side-effect imports create correctness pitfalls. A regex-only analyzer would be misleading.

## Proposed algorithm

1. Use a real language parser and TypeScript module resolver for supported JS/TS/JSX/TSX inputs. Record parse version and resolution diagnostics.
2. Track **value-level and type-level symbols** across imports and re-exports while preserving side effects and module initialization dependencies.
3. Map changed source spans to declared exported symbols, including default exports and re-export chains. Track potential effect on module initialization.
4. Compute a test-dependency graph; recommend narrower candidate feedback **only** when every involved module and syntax form was resolved and no module side effects or dynamic imports can invalidate the result.
5. On unknown, unsupported, broken, ambiguous or cyclic resolution, fall back to file-level or full-suite advisory rather than guessing.
6. Never disable protected full CI; verify recall against actual test suites and independent fixture oracles.

## Acceptance criteria before claiming shipped

- JS, TS, JSX, TSX syntax, default/named/namespace imports, barrels, circular imports
- Type-only imports, module side effects and dynamic import uncertainty
- Multiple tsconfig inheritance chains, monorepos, Astro/Vite resolution, package exports
- Tests showing zero missed affected files for every supported fixture
- Reproducible comparisons with test-runner selections and real external beta evidence
- Documented optional dependency footprint, CPU/memory bounds and threat model

The current conservative file graph remains the default. No symbol-level speed or precision promise should appear in a release until these gates pass.
