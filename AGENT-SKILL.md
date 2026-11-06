# AgentFast agent skill (preview)

A portable, instruction-based skill for Codex and Claude Code to use the existing AgentFast v0.2 CLI for conservative verification planning. This is **not** an official OpenAI or Anthropic extension, and is **not** a new package release.

## Install into a target project

First install AgentFast from a verified release and confirm `agentfast --version`. Then, from the project where you want the skill:

### Codex
```bash
mkdir -p .agents/skills/agentfast
cp /path/to/agentfast/skills/agentfast/SKILL.md .agents/skills/agentfast/SKILL.md
```

### Claude Code
```bash
mkdir -p .claude/skills/agentfast
cp /path/to/agentfast/skills/agentfast/SKILL.md .claude/skills/agentfast/SKILL.md
```

For user-level installation, use `~/.agents/skills/agentfast/` (Codex) or `~/.claude/skills/agentfast/` (Claude Code).

Ask your agent: "Use the AgentFast skill to explain the tests affected by this diff. Run quick feedback tests, but keep full required CI."

## Manual baseline

```bash
agentfast check --base HEAD --format json
```

A `targeted` result helps find fast feedback. It never justifies skipping required verification. Alias imports and other unknown dependency edges may require a full suite.

## What this adds

- A reusable skill manifest with explicit trigger and safety rules
- A documented project-level installation workflow
- A structural regression test for critical instructions

It does not execute tests automatically, install any software automatically, query AI models, or change the AgentFast CLI.
