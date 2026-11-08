/**
 * Extract analyzable JavaScript / TypeScript from Astro frontmatter and inline scripts.
 * This is a conservative heuristic, not a full Astro compiler/parser.
 */
export function extractAstroScripts(input) {
  const source = String(input).replace(/^\uFEFF/, '');
  const sections = [];
  const diagnostics = [];
  const opening = /^\s*---[ \t]*\r?\n/;
  const start = opening.exec(source);
  if (start) {
    const remaining = source.slice(start[0].length);
    const end = /^---[ \t]*\r?$/m.exec(remaining);
    if (!end) {
      diagnostics.push('unterminated Astro frontmatter');
    } else {
      sections.push(remaining.slice(0, end.index));
    }
  } else if (/^\s*---/.test(source)) {
    diagnostics.push('unsupported Astro frontmatter layout');
  }
  const scripts = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  if ((source.match(/<script\b/gi) || []).length > scripts.length) {
    diagnostics.push('unsupported Astro script markup');
  }
  for (const script of scripts) {
    if (/\bsrc\s*=/i.test(script[1])) {
      diagnostics.push('external Astro script source requires broader verification');
      continue;
    }
    sections.push(script[2]);
  }
  if (/\bimport\.meta\.glob\s*\(/.test(source)) {
    diagnostics.push('Astro import.meta.glob is not statically resolved');
  }
  return { source: sections.join('\n'), diagnostics };
}
