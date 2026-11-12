import { lstatSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

const MAX_MANIFEST_BYTES = 256 * 1024;
const MAX_WORKSPACE_BYTES = 128 * 1024;
const RESOLVABLE_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs', '.json', '.astro'];

function safePath(raw) {
  if (typeof raw !== 'string' || !raw || raw.includes('\\') || raw.includes('\0') || raw.startsWith('/') || /^[a-z]:/i.test(raw)) return null;
  const path = posix.normalize(raw.replace(/^\.\//, ''));
  if (path === '.' || path === '..' || path.startsWith('../') || path.startsWith('/')) return null;
  return path;
}

function readManifest(root, relative) {
  const full = join(root, relative);
  const stat = lstatSync(full);
  if (!stat.isFile() || stat.size > MAX_MANIFEST_BYTES) throw new Error('manifest is not a regular file or exceeds limit');
  const value = JSON.parse(readFileSync(full, 'utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('manifest must be an object');
  return value;
}

function declaredPatterns(manifest) {
  if (manifest.workspaces == null) return [];
  const raw = Array.isArray(manifest.workspaces) ? manifest.workspaces : manifest.workspaces?.packages;
  if (!Array.isArray(raw)) throw new Error('unsupported workspaces declaration');
  return raw.map(pattern => {
    if (typeof pattern !== 'string' || pattern.includes('!') || pattern.includes('**') || pattern.includes('\\')) throw new Error('unsupported workspace glob');
    const stripped = pattern.replace(/\/$/, '');
    const isDirectChild = stripped.endsWith('/*');
    const parent = safePath(isDirectChild ? stripped.slice(0, -2) : stripped);
    if (!parent || parent.includes('*') || parent.includes('?') || parent.includes('[')) throw new Error('unsupported workspace glob');
    return { parent, isDirectChild };
  });
}

// Deliberately accepts only a tiny, unambiguous subset of pnpm YAML:
// packages:
//   - 'packages/*'
//   - apps/*
// Comments, simple quoting and CRLF are supported. Anything else fails closed.
function pnpmPatterns(root) {
  const file = join(root, 'pnpm-workspace.yaml');
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.size > MAX_WORKSPACE_BYTES) throw new Error('invalid or oversized pnpm workspace file');
  const raw = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  let header = false;
  const values = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (!header) {
      if (line !== 'packages:') throw new Error('unsupported YAML: expected packages: at root');
      header = true;
      continue;
    }
    const match = /^  -[ \t]+(.+?)\s*$/.exec(line);
    if (!match) throw new Error('unsupported pnpm YAML field or item indentation');
    let value = match[1];
    if (/^["']/.test(value)) {
      const quote = value[0];
      const end = value.indexOf(quote, 1);
      if (end < 1 || !/^\s*(?:#.*)?$/.test(value.slice(end + 1))) throw new Error('unsupported quoted pnpm workspace pattern');
      value = value.slice(1, end);
      if (value.includes(quote)) throw new Error('unsupported YAML escape/quote');
    } else {
      value = value.split(/\s+#/)[0].trim();
      if (/[:"'\[\]{},&|>!]/.test(value)) throw new Error('unsupported pnpm YAML pattern');
    }
    values.push(value);
  }
  if (!header || !values.length) throw new Error('missing pnpm workspace packages list');
  return declaredPatterns({ workspaces: values });
}

function matchesPattern(dir, pattern) {
  if (pattern.isDirectChild) return posix.dirname(dir) === pattern.parent && dir !== pattern.parent;
  return dir === pattern.parent;
}

function candidatePaths(entry) {
  return RESOLVABLE_EXTENSIONS.flatMap(ext => ext ? [entry + ext, posix.join(entry, 'index' + ext)] : [entry]);
}

function entryForSubpath(manifest, subpath) {
  if (manifest.exports != null) {
    const value = manifest.exports;
    if (typeof value === 'string') return subpath ? null : value;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const key = subpath ? './' + subpath : '.';
    const resolved = value[key];
    // Conditional exports and wildcard exports cannot be proven safe with the supported heuristics.
    return typeof resolved === 'string' ? resolved : null;
  }
  if (subpath) return null;
  for (const key of ['source', 'module', 'main']) {
    if (typeof manifest[key] === 'string') return manifest[key];
  }
  return null;
}

/**
 * Resolve simple root npm/yarn workspaces or simple pnpm-workspace.yaml lists.
 * Unknown YAML, conflicting roots and ambiguous exports must fail closed.
 */
export function loadWorkspaces(root, files) {
  const fileSet = new Set(files);
  const diagnostics = [];
  const known = new Map();
  try {
    const rootPatterns = fileSet.has('package.json') ? declaredPatterns(readManifest(root, 'package.json')) : [];
    const hasPnpm = fileSet.has('pnpm-workspace.yaml');
    const pnpm = hasPnpm ? pnpmPatterns(root) : [];
    if (hasPnpm && rootPatterns.length) {
      const names = patterns => patterns.map(p => p.parent + (p.isDirectChild ? '/*' : '')).sort();
      if (JSON.stringify(names(rootPatterns)) !== JSON.stringify(names(pnpm))) {
        throw new Error('conflicting pnpm and package.json workspace declarations');
      }
    }
    const patterns = hasPnpm ? pnpm : rootPatterns;
    let matchedManifests = 0;
    for (const manifestPath of files.filter(p => p !== 'package.json' && p.endsWith('/package.json'))) {
      const dir = posix.dirname(manifestPath);
      if (!patterns.some(pattern => matchesPattern(dir, pattern))) continue;
      matchedManifests++;
      const pkg = readManifest(root, manifestPath);
      if (typeof pkg.name !== 'string' || !/^(?:@[a-zA-Z0-9._-]+\/)?[a-zA-Z0-9._-]+$/.test(pkg.name)) throw new Error('invalid workspace package name at ' + manifestPath);
      if (known.has(pkg.name)) throw new Error('duplicate workspace package name: ' + pkg.name);
      known.set(pkg.name, { dir, manifest: pkg });
    }
    if (patterns.length && !matchedManifests) throw new Error('no package manifests matched workspace patterns');
  } catch (error) {
    diagnostics.push({
      path: fileSet.has('pnpm-workspace.yaml') ? 'pnpm-workspace.yaml' : 'package.json',
      reason: 'unsupported workspace configuration: ' + error.message
    });
    known.clear();
  }

  return {
    diagnostics,
    resolve(spec) {
      const match = [...known.entries()]
        .filter(([name]) => spec === name || spec.startsWith(name + '/'))
        .sort((a, b) => b[0].length - a[0].length)[0];
      if (!match) return { kind: 'external' };
      const [name, pkg] = match;
      const suffix = spec === name ? '' : spec.slice(name.length + 1);
      const entry = entryForSubpath(pkg.manifest, suffix);
      if (typeof entry !== 'string' || !entry.startsWith('./')) return { kind: 'unknown', reason: 'workspace import has no supported source export: ' + spec };
      const safe = safePath(entry);
      if (!safe) return { kind: 'unknown', reason: 'workspace export escapes package: ' + spec };
      const path = posix.normalize(posix.join(pkg.dir, safe));
      if (path !== pkg.dir && !path.startsWith(pkg.dir + '/')) return { kind: 'unknown', reason: 'workspace export escapes package: ' + spec };
      const found = [...new Set(candidatePaths(path).filter(file => fileSet.has(file)))];
      if (found.length === 1) return { kind: 'resolved', path: found[0] };
      return { kind: 'unknown', reason: (found.length ? 'ambiguous' : 'missing') + ' workspace source target: ' + spec };
    }
  };
}
