import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skill = readFileSync(resolve(root, 'skills/agentfast/SKILL.md'), 'utf8').replace(/\r\n/g, '\n');
const docs = readFileSync(resolve(root, 'docs/AGENT-SKILL.md'), 'utf8');

test('AgentFast skill has discoverable frontmatter', () => {
  assert.match(skill, /^---\nname: agentfast\ndescription: .+\n---\n/);
});
test('AgentFast skill preserves verification safety principles', () => {
  for (const phrase of ['agentfast check --base HEAD --format json', 'decision.mode', 'targeted', 'required full CI', 'untrusted']) {
    assert.ok(skill.includes(phrase), 'Missing skill guardrail: ' + phrase);
  }
});
test('AgentFast integration is explicitly preview-only and supports both agent directories', () => {
  assert.match(docs, /not.*new package release/i);
  assert.ok(docs.includes('.agents/skills/agentfast'));
  assert.ok(docs.includes('.claude/skills/agentfast'));
});
