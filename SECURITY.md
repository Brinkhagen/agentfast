# Security Policy

## Supported versions

| Version | Security maintenance |
| --- | --- |
| 0.1.x | Supported during initial development |
| Earlier | Not supported |

## Private disclosure

Please **do not publish exploitable vulnerabilities** in GitHub issues. Email **info@brinkhagen.de** with subject `AgentFast security report`, or use GitHub private vulnerability reporting if enabled in repository settings.

Include a minimal proof of concept, affected revision, impact, and a contact method. Do not send credentials, real customer data, or unredacted proprietary source code. We will acknowledge reports as capacity allows and coordinate disclosure and fixes responsibly; response times are not guaranteed.

## Threat model

- Tool runs locally and reads project files; it does not send files to remote servers.
- Git is invoked with argument arrays (`shell: false`) to avoid shell interpretation.
- Repository traversal skips symlinked directories, dependency folders, and build outputs.
- Repo content is untrusted and **is not executed** by AgentFast's analysis.
- We do not execute proposed tests, evaluate source code, or install dependencies.
- Static import analysis is incomplete. If paths are unresolved, recommend broad tests instead of claiming completeness.

The tool is currently an advisory preflight helper, not a formal security scanner.