import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

const SOURCE_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs', '.json'];
const ALIAS_LIKE = /^(?:@\/|~\/|src\/|#)/;
const MAX_CONFIG_BYTES = 256 * 1024;

// Remove JSONC comments and trailing commas without changing quoted strings.
function parseJsonc(input) {
  let output = '', quoted = false, escaped = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i], next = input[i + 1];
    if (quoted) {
      output += c;
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') { quoted = true; output += c; continue; }
    if (c === '/' && next === '/') {
      i += 2;
      while (i < input.length && input[i] !== '\n') i++;
      output += '\n';
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < input.length - 1 && !(input[i] === '*' && input[i + 1] === '/')) {
        if (input[i] === '\n') output += '\n';
        i++;
      }
      i++;
      continue;
    }
    if (c === ',') {
      let j = i + 1;
      while (/\s/.test(input[j] || '') && j < input.length) j++;
      if (input[j] === '}' || input[j] === ']') continue;
    }
    output += c;
  }
  return JSON.parse(output);
}

function insideRepo(path) {
  return path && path !== '..' && !path.startsWith('../') && !posix.isAbsolute(path);
}

function wildcardCount(text) { return (text.match(/\*/g) || []).length; }

function matchKey(key, spec) {
  const index = key.indexOf('*');
  if (index < 0) return key === spec ? '' : null;
  const prefix = key.slice(0, index), suffix = key.slice(index + 1);
  if (!spec.startsWith(prefix) || !spec.endsWith(suffix) || spec.length < prefix.length + suffix.length) return null;
  return spec.slice(prefix.length, spec.length - suffix.length);
}

function candidates(path) {
  const options = [];
  for (const ext of SOURCE_EXTENSIONS) options.push(path + ext);
  for (const ext of SOURCE_EXTENSIONS.slice(1)) options.push(posix.join(path, 'index' + ext));
  return options;
}

// Root tsconfig/jsconfig only. Complex inheritance and workspace resolution are deliberately conservative.
export function loadAliases(root) {
  const configFile = ['tsconfig.json', 'jsconfig.json'].find(name => existsSync(join(root, name)));
  const diagnostics = [];
  let rules = [];
  let baseUrl = '';
  if (configFile) {
    try {
      const full = join(root, configFile);
      const stat = lstatSync(full);
      if (!stat.isFile() || stat.size > MAX_CONFIG_BYTES) throw new Error('invalid or oversized config');
      const cfg = parseJsonc(readFileSync(full, 'utf8'));
      if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) throw new Error('invalid config shape');
      if (cfg.extends || cfg.references) throw new Error('extends/references are unsupported');
      const opts = cfg.compilerOptions || {};
      if (typeof opts !== 'object' || Array.isArray(opts)) throw new Error('invalid compilerOptions');
      if (opts.baseUrl != null) {
        if (typeof opts.baseUrl !== 'string' || opts.baseUrl.includes('\\')) throw new Error('invalid baseUrl');
        baseUrl = posix.normalize(opts.baseUrl || '.');
        if (baseUrl === '.') baseUrl = '';
        if (baseUrl && !insideRepo(baseUrl)) throw new Error('baseUrl leaves repository');
      }
      if (opts.paths != null) {
        if (!opts.paths || typeof opts.paths !== 'object' || Array.isArray(opts.paths)) throw new Error('invalid paths');
        rules = Object.entries(opts.paths).map(([key, values]) => {
          if (!key || wildcardCount(key) > 1 || key.includes('\\') || !Array.isArray(values) || values.length === 0 || values.some(v => typeof v !== 'string' || !v || wildcardCount(v) > 1 || v.includes('\\'))) throw new Error('unsupported path alias configuration');
          return { key, values, specificity: key.replace('*', '').length };
        });
      }
    } catch (error) {
      diagnostics.push({ path: configFile, reason: 'unsupported alias configuration: ' + error.message });
      rules = [];
    }
  }
  return {
    diagnostics,
    resolve(spec, lookup) {
      const matches = rules.map(rule => ({ rule, part: matchKey(rule.key, spec) })).filter(r => r.part !== null)
        .sort((a,b) => Number(!a.rule.key.includes('*')) - Number(!b.rule.key.includes('*')) || a.rule.specificity - b.rule.specificity).reverse();
      if (!matches.length) return ALIAS_LIKE.test(spec) ? { kind: 'unknown', reason: 'unresolved alias import: ' + spec } : { kind: 'external' };
      const mostSpecific = matches.filter(m => m.rule.specificity === matches[0].rule.specificity && m.rule.key.includes('*') === matches[0].rule.key.includes('*'));
      if (mostSpecific.length !== 1) return { kind: 'unknown', reason: 'ambiguous alias mapping: ' + spec };
      const {rule, part} = mostSpecific[0];
      const resolved = new Set();
      for (const value of rule.values) {
        const mapped = value.replace('*', part);
        const path = posix.normalize(posix.join(baseUrl, mapped));
        if (!insideRepo(path)) return { kind: 'unknown', reason: 'alias escapes repository: ' + spec };
        for (const candidate of candidates(path)) {
          if (lookup.has(candidate)) { resolved.add(candidate); break; }
        }
      }
      if (resolved.size === 1) return { kind: 'resolved', path: [...resolved][0] };
      return { kind: 'unknown', reason: resolved.size ? 'ambiguous alias target: ' + spec : 'unresolved alias import: ' + spec };
    }
  };
}
