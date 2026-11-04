# Maintainers and project governance

AgentFast is an independently maintained, MIT-licensed open-source project by **BRINKHAGEN**. It is not an official OpenAI, Anthropic or GitHub project.

## Primary maintainer

- GitHub account: [@Brinkhagen](https://github.com/Brinkhagen)
- Project repository: [Brinkhagen/agentfast](https://github.com/Brinkhagen/agentfast)
- Contact route for ordinary bugs: [GitHub Issues](https://github.com/Brinkhagen/agentfast/issues)
- Security reports: follow [SECURITY.md](SECURITY.md); avoid publishing exploit details in public issues

The project is currently in early beta. A named maintainer and published code do **not** imply an established user base or active external contributor community.

## Review principles

1. **Correctness before shorter test runs.** A change that introduces uncertainty must not silently make the recommendation less conservative.
2. **Evidence in every change.** A pull request should describe its purpose, scope, relevant tests and how risk was assessed.
3. **Regression tests for safety policies.** Changes to sensitive path matching, import traversal, Git diff interpretation or error handling require reproducible tests.
4. **Protected CI remains authoritative.** AgentFast is advisory, never a substitute for required tests and code review.
5. **Transparent releases.** Versioned tags, changelog entries and known limitations must accompany meaningful public changes.
6. **No fabricated adoption.** Stars, downloads, user reports, contributors and benchmarks should be attributable to real activity.

## How issues are handled

- **Bug reports:** confirm the minimal reproduction and expected/actual output.
- **Safety concerns:** prioritize potential false-negative risk recommendations; direct security-sensitive details to the security policy.
- **Feature requests:** compare against the focused scope and roadmap before committing to delivery.
- **Pull requests:** run `npm ci && npm run verify` and explain whether a change could alter test-selection safety.
- **Releases:** use [release process](docs/RELEASE.md), and verify platform-specific CI before promoting a new version.

External collaborators are welcome. No person is represented as a core maintainer without their agreement and demonstrated ongoing responsibility.

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
