import { createRequire } from 'node:module';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { git } from './git.js';

const MAX_BYTES = 512 * 1024;
const MAX_CHANGED_FILES = 128;
const TYPES = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.mts','.cts']);

function loadParser(root) {
  for (const from of [join(root, 'package.json'), import.meta.url]) {
    try {
      const ts = createRequire(from)('typescript');
      if (typeof ts.createSourceFile === 'function' && ts.versionMajorMinor) return ts;
    } catch { /* TypeScript is deliberately optional. */ }
  }
  return null;
}

function exportedNames(ts, statement) {
  const mods = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) || [] : [];
  const exported = mods.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  const defaulted = mods.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
  if (ts.isExportAssignment(statement)) return statement.isExportEquals ? null : ['default'];
  if (ts.isExportDeclaration(statement)) return null; // Re-exports need compiler-level resolution.
  if (!exported) return [];
  if (defaulted) return ['default'];
  if (ts.isVariableStatement(statement)) {
    const names = statement.declarationList.declarations.map(d => ts.isIdentifier(d.name) ? d.name.text : null);
    return names.every(Boolean) ? names : null;
  }
  if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement)) return statement.name ? [statement.name.text] : null;
  return null;
}

function snapshot(ts, path, source) {
  const ext = extname(path).toLowerCase();
  const kind = ext === '.tsx' ? ts.ScriptKind.TSX : ext === '.jsx' ? ts.ScriptKind.JSX :
    ['.js','.mjs','.cjs'].includes(ext) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, kind);
  if (ast.parseDiagnostics?.length) return { error: 'TypeScript parser reported a syntax error' };
  const exports = new Map();
  const other = [];
  for (const statement of ast.statements) {
    const names = exportedNames(ts, statement);
    if (names === null) return { error: 'Re-export, export-assignment or unsupported declaration' };
    if (!names.length) { other.push(statement.getText(ast)); continue; }
    for (const name of names) {
      if (exports.has(name)) return { error: 'Duplicate exported declaration' };
      exports.set(name, statement.getText(ast));
    }
  }
  if (/\b(module\.exports|exports\s*\[|exports\.)/.test(source)) return { error: 'CommonJS exports are unsupported by the symbol preview' };
  return { exports, other: other.join('\n') };
}

/**
 * EXPERIMENTAL export-declaration diff. Does not narrow suggested test scope.
 * Uses TypeScript installed in the target project (or AgentFast development checkout).
 */
export function analyzeSymbolChanges(root, base, changes, { typescript } = {}) {
  const ts = typescript || loadParser(root);
  const caveat = 'Export declaration hints are experimental. Internal helpers, side effects, aliases, framework compilers and transitive imports may influence other symbols. AgentFast does not narrow its file-level test recommendation using this data. Full protected CI is still required.';
  if (!ts) return { status: 'unavailable', parser: 'typescript (optional)', diagnostics: ['TypeScript compiler not found. Install typescript in the target project to enable --symbol-impact.'], changes: [], caveat };
  const diagnostics = [];
  const output = [];
  const eligible = changes.filter(c => TYPES.has(extname(c.path).toLowerCase()) && !/\.d\.[cm]?ts$/.test(c.path));
  if (eligible.length > MAX_CHANGED_FILES) return { status: 'inconclusive', parser: 'typescript ' + ts.version, diagnostics: ['Too many changed files for the experimental symbol preview'], changes: [], caveat };
  for (const c of eligible) {
    const path = c.path;
    if (c.status === 'deleted' || c.status === 'renamed' || c.status === 'copied' || c.status === 'type-changed') {
      diagnostics.push({ path, reason: 'Structural changes require file-level analysis' });
      continue;
    }
    let current;
    try {
      const full = join(root, path);
      const stat = lstatSync(full);
      if (!stat.isFile() || stat.size > MAX_BYTES) throw Error('not a regular file or exceeds size limit');
      current = readFileSync(full, 'utf8');
    } catch {
      diagnostics.push({ path, reason: 'Cannot safely read changed source' });
      continue;
    }
    let previous = '';
    if (!['added','untracked'].includes(c.status)) {
      try { previous = git(['show', base + ':' + path], root); }
      catch {
        diagnostics.push({ path, reason: 'Could not load base revision of changed source' });
        continue;
      }
    }
    const before = snapshot(ts, path, previous);
    const after = snapshot(ts, path, current);
    if (before.error || after.error) {
      diagnostics.push({ path, reason: before.error || after.error });
      continue;
    }
    const names = [...new Set([...before.exports.keys(), ...after.exports.keys()])].sort();
    const changedExports = names.filter(name => before.exports.get(name) !== after.exports.get(name))
      .map(name => ({ name, change: !before.exports.has(name) ? 'added' : !after.exports.has(name) ? 'removed' : 'modified' }));
    output.push({
      path,
      changedExports,
      nonExportStatementsChanged: before.other !== after.other,
      // No negative impact claim even when all export statements appear unchanged.
      interpretation: 'Direct top-level exported declarations only; not a complete symbol dependency graph'
    });
  }
  return { status: diagnostics.length ? 'partial' : 'preview', parser: 'typescript ' + ts.version, changes: output, diagnostics, caveat };
}
