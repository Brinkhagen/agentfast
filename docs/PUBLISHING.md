# Distribution and website deployment

## GitHub Release

When the initial GitHub Release workflow runs, it checks the package, executes the full test suite, creates an npm tarball and publishes v0.1.0 only if no matching GitHub Release exists. It does **not** publish to npm.

GitHub Releases: https://github.com/Brinkhagen/agentfast/releases

## Website

The `Publish Website Branch` workflow copies the static site under `docs/` into the `gh-pages` branch. GitHub Pages still needs to be enabled in the repository's Settings → Pages → **Deploy from a branch** → `gh-pages` / `/(root)`.

Until that setting is enabled and a deployment is verified, **do not claim the website is live**.

The default public Pages address, once enabled, is usually `https://brinkhagen.github.io/agentfast/`.

## Repository About, topics, and social preview

The public GitHub repository has separate administrative settings that are not set by committing files:

- Description: `Conservative, explainable test planning for AI-assisted code changes. Local-first, zero API keys, MIT.`
- Website: use the verified Pages URL
- Topics: `ai-coding`, `codex`, `claude-code`, `test-automation`, `developer-tools`, `typescript`, `git-diff`, `nodejs`, `open-source`
- Social preview: upload `docs/assets/social-card.png` from the source package in Settings → General → Social preview (GitHub requires a graphical upload for this setting).

## npm registry

npm publishing requires an authorized npm account that controls `@brinkhagen` and an appropriate publishing method. The GitHub Release artifact is installable without npm registry publication. No registry release is implied until it can be verified at npmjs.com.
