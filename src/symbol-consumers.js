// Experimental, read-only AST evidence. NEVER use this to exclude tests from the
// existing file-level plan: runtime side effects and indirect references are unknown.
import { lstatSync, readFileSync } from 'node:fs';
import { extname, join, posix } from 'node:path';
import { discover, isTest } from './analyze.js';

const EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];
const SOURCE = new Set(EXTENSIONS);
const MAX_MODULES = 1024;
const MAX_BYTES = 512 * 1024;
const MAX_EDGES = 12000;
const MAX_DIAGNOSTICS = 30;

function scriptKind(ts, path) {
  const ext = extname(path).toLowerCase();
  return ext === '.tsx' ? ts.ScriptKind.TSX : ext === '.jsx' ? ts.ScriptKind.JSX :
    ['.js', '.mjs', '.cjs'].includes(ext) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
}

function resolveRelative(from, spec, available) {
  if (!spec.startsWith('.')) return null;
  const base = posix.normalize(posix.join(posix.dirname(from), spec));
  if (base === '..' || base.startsWith('../') || base.startsWith('/')) return null;
  const candidates = [base, ...EXTENSIONS.map(ext => base + ext)];
  // TypeScript allows .js specifiers targeting .ts source files in many projects.
  if (/\.[cm]?jsx?$/.test(base)) {
    const bare = base.replace(/\.[cm]?jsx?$/, '');
    candidates.push(...EXTENSIONS.map(ext => bare + ext));
  }
  candidates.push(...EXTENSIONS.map(ext => posix.join(base, 'index' + ext)));
  return candidates.find(candidate => available.has(candidate)) || null;
}

function importNames(ts, node) {
  if (ts.isImportDeclaration(node)) {
    const clause = node.importClause;
    if (!clause) return ['*']; // Side-effect import; never assume safe.
    const names = [];
    if (clause.name) names.push('default');
    if (clause.namedBindings) {
      if (ts.isNamespaceImport(clause.namedBindings)) names.push('*');
      else if (ts.isNamedImports(clause.namedBindings)) {
        for (const e of clause.namedBindings.elements)
          names.push((e.propertyName || e.name).text);
      }
    }
    return names;
  }
  if (ts.isExportDeclaration(node)) {
    if (!node.exportClause || ts.isNamespaceExport(node.exportClause)) return ['*'];
    if (ts.isNamedExports(node.exportClause))
      return node.exportClause.elements.map(e => (e.propertyName || e.name).text);
  }
  return ['*'];
}

/**
 * Report possible consumers of changed top-level exported names. Re-export
 * chains are traversed at FILE level, never at symbol level. The resulting
 * candidates are only review hints, NOT a complete or safe selection.
 */
export function previewSymbolConsumers(root, changedExports, { typescript: ts } = {}) {
  const disclaimer = 'Research-only possible consumers. All module-level side effects, execution paths, aliases, re-exports and transitive dependencies may broaden impact. Candidate tests MUST NOT replace file-level recommendations or full CI.';
  if (!ts) return { status: 'unavailable', disclaimer, candidates: [], diagnostics: ['TypeScript AST parser is unavailable'] };
  const { files, truncated } = discover(root);
  const scripts = files.filter(path => SOURCE.has(extname(path).toLowerCase()));
  const diagnostics = [];
  const addDiagnostic = (path, reason) => {
    if (diagnostics.length < MAX_DIAGNOSTICS) diagnostics.push({ path, reason });
  };
  if (truncated || scripts.length > MAX_MODULES) {
    return { status: 'inconclusive', disclaimer, candidates: [],
      diagnostics: [{ path: '', reason: 'File/module limit exceeded; no consumer hints' }] };
  }
  const available = new Set(scripts);
  const reverse = new Map();
  let edgeCount = 0;
  for (const path of scripts) {
    let content;
    try {
      const stat = lstatSync(join(root, path));
      if (!stat.isFile() || stat.size > MAX_BYTES) throw Error('not a regular in-limit file');
      content = readFileSync(join(root, path), 'utf8');
    } catch {
      addDiagnostic(path, 'Source could not be read safely within the size limit');
      continue;
    }
    const ast = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, scriptKind(ts, path));
    if (ast.parseDiagnostics?.length) {
      addDiagnostic(path, 'Syntax error; module dependencies may be incomplete');
      continue;
    }
    for (const stmt of ast.statements) {
      if (!ts.isImportDeclaration(stmt) && !ts.isExportDeclaration(stmt)) {
        if (ts.isImportEqualsDeclaration(stmt)) addDiagnostic(path, 'Import-equals requires separate resolution');
        continue;
      }
      if (!stmt.moduleSpecifier) continue;
      const spec = stmt.moduleSpecifier.text;
      if (typeof spec !== 'string') {
        addDiagnostic(path, 'Unsupported module specifier');
        continue;
      }
      if (!spec.startsWith('.')) {
        // External packages and internal workspace/alias imports are intentionally
        // indistinguishable here: do NOT call the graph complete.
        addDiagnostic(path, 'Non-relative import or re-export is not resolved: ' + spec);
        continue;
      }
      const resolved = resolveRelative(path, spec, available);
      if (!resolved) {
        addDiagnostic(path, 'Unresolved local import or re-export: ' + spec);
        continue;
      }
      if (!reverse.has(resolved)) reverse.set(resolved, []);
      reverse.get(resolved).push({ importer: path, names: importNames(ts, stmt) });
      if (++edgeCount > MAX_EDGES) {
        return { status: 'inconclusive', disclaimer, candidates: [],
          diagnostics: [{ path: '', reason: 'Import edge limit exceeded; no consumer hints' }] };
      }
    }
    // Static top-level imports above are not an execution-precise call graph.
    // Computed and literal dynamic imports, require(), and CommonJS exports
    // may create edges this preview has not recorded.
    function examine(node) {
      if (ts.isCallExpression(node) &&
          (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
           (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
        addDiagnostic(path, 'Dynamic import or CommonJS require is not resolved');
      }
      ts.forEachChild(node, examine);
    }
    ts.forEachChild(ast, examine);
    if (/(\bmodule\.exports\b|\bexports\s*[\[.])/.test(content))
      addDiagnostic(path, 'CommonJS export assignment not modeled');
  }
  const candidates = [];
  for (const item of changedExports) {
    const { path, changedExports: names = [] } = item;
    if (!available.has(path)) continue;
    const wanted = new Set(names.map(n => n.name));
    if (!wanted.size) continue;
    const direct = (reverse.get(path) || []).filter(edge =>
      edge.names.includes('*') || edge.names.some(name => wanted.has(name)));
    const directImporters = [...new Set(direct.map(edge => edge.importer))].sort();
    const queue = [...directImporters];
    const visited = new Set(queue);
    while (queue.length) {
      const file = queue.shift();
      for (const edge of reverse.get(file) || []) {
        if (!visited.has(edge.importer)) {
          visited.add(edge.importer);
          queue.push(edge.importer);
        }
      }
    }
    const possibleTests = [...visited].filter(isTest).sort();
    candidates.push({ path, exportedNames: [...wanted].sort(), directImporters,
      possibleTests, interpretation: 'Named direct consumers plus file-level transitive candidates; NEVER an exclusion list' });
  }
  return { status: diagnostics.length ? 'partial' : 'preview', scannedModules: scripts.length,
    scannedEdges: edgeCount, disclaimer, candidates, diagnostics };
}
