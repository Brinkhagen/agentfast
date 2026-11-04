# Release and deployment

The first public release has been published:

- [AgentFast v0.1.0 on GitHub Releases](https://github.com/Brinkhagen/agentfast/releases/tag/v0.1.0)
- [GitHub Release automation](https://github.com/Brinkhagen/agentfast/actions/workflows/release.yml)
- [Website branch automation](https://github.com/Brinkhagen/agentfast/actions/workflows/publish-site.yml)

The release attaches an installable `brinkhagen-agentfast-0.1.0.tgz` archive. **It is not yet listed in the npm registry.**

The website files are automatically copied to the `gh-pages` branch, but enabling GitHub Pages in repository settings may still be required. See [Publishing](PUBLISHING.md).

## Before subsequent releases

1. Review issues, changes and safety impact.
2. Add regression tests for any change that could recommend fewer tests.
3. Run `npm ci && npm run verify` locally.
4. Confirm CI on all supported operating systems.
5. Update changelog, docs and package version.
6. Review packaged files and publish an immutable versioned tag and release.
7. Never claim features, downloads, adoption or benchmarks that haven't been verified.
