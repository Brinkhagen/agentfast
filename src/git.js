import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

export class GitError extends Error { constructor(message) { super(message); this.name = 'GitError'; } }

export function git(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', shell: false, timeout: 20000, maxBuffer: 16 * 1024 * 1024, windowsHide: true });
  if (result.error) throw new GitError(`Failed to run git: ${result.error.message}`);
  if (result.status !== 0) throw new GitError((result.stderr || result.stdout || '').trim() || `git exited with status ${result.status}`);
  return result.stdout;
}

export function repositoryRoot(cwd = process.cwd()) {
  return resolve(git(['rev-parse', '--show-toplevel'], cwd).trim());
}

export function parseNameStatusZ(data) {
  const tokens = data.split('\0');
  const changes = [];
  let cursor = 0;
  while (cursor < tokens.length && tokens[cursor] !== '') {
    const status = tokens[cursor++];
    const code = status[0];
    if (!/^[A-Z?]$/.test(code)) throw new GitError(`Unexpected git status: ${status}`);
    if (code === 'R' || code === 'C') {
      const previousPath = tokens[cursor++];
      const path = tokens[cursor++];
      if (previousPath === undefined || path === undefined) throw new GitError('Malformed git rename/copy output');
      changes.push({ status: code === 'R' ? 'renamed' : 'copied', path: path.replaceAll('\\','/'), previousPath: previousPath.replaceAll('\\','/') });
    } else {
      const path = tokens[cursor++];
      if (path === undefined) throw new GitError('Malformed git change output');
      const name = ({ A:'added', M:'modified', D:'deleted', T:'type-changed', U:'unmerged' })[code] || 'changed';
      changes.push({ status:name, path:path.replaceAll('\\','/') });
    }
  }
  return changes;
}

export function listChanges(root, base = 'HEAD') {
  if (!base || base.startsWith('-')) throw new GitError('Invalid --base reference. Expected a branch, tag or commit.');
  const tracked = parseNameStatusZ(git(['diff','--name-status','-z','--find-renames',base,'--'],root));
  const untracked = git(['ls-files','--others','--exclude-standard','-z'],root)
    .split('\0').filter(Boolean).map(path => ({ status:'untracked',path:path.replaceAll('\\','/') }));
  const byPath = new Map();
  for (const change of [...tracked,...untracked]) byPath.set(change.path,change);
  return [...byPath.values()].sort((a,b)=>a.path.localeCompare(b.path));
}
