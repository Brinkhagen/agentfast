# Release and deployment policy

AgentFast uses versioned GitHub Releases and **preserves all old releases and tags**.

- [Release history](https://github.com/Brinkhagen/agentfast/releases)
- [v0.1.0 source and package](https://github.com/Brinkhagen/agentfast/releases/tag/v0.1.0)
- [v0.2.0 release](https://github.com/Brinkhagen/agentfast/releases/tag/v0.2.0)
- [v0.3.0 release](https://github.com/Brinkhagen/agentfast/releases/tag/v0.3.0) (after verified publication)
- [Cross-platform CI](https://github.com/Brinkhagen/agentfast/actions/workflows/ci.yml)
- [Release automation](https://github.com/Brinkhagen/agentfast/actions/workflows/release.yml)
- [Website publishing](https://github.com/Brinkhagen/agentfast/actions/workflows/publish-site.yml)

## How releases work

1. A maintainer reviews changes and adds a regression test whenever safety recommendations could be affected.
2. Update the package version in `package.json` and `package-lock.json`, the changelog, README and release notes.
3. GitHub CI must pass on **Node 20 and 22 across Windows, macOS and Linux**.
4. On successful CI for a push to the default branch, the release workflow verifies and packages the exact CI-tested commit.
5. It creates a new `vX.Y.Z` GitHub Release only if that version does not exist. Published versions are **never silently replaced**.
6. Failed CI prevents automated publication; fix the problems and rerun verification on a new commit.

This workflow does **not** publish to the public npm registry. Distribution is through a downloadable GitHub Release archive until npm publication is separately configured.

## Safety and limitations

- Maintain full protected CI in consuming projects.
- `targeted` is for rapid feedback only, not proof of adequate coverage.
- Do not claim measured speedups, real user numbers or unrelated integrations without verifiable evidence.
- Protect GitHub releases/tags from accidental deletion and review GitHub Actions changes carefully.
