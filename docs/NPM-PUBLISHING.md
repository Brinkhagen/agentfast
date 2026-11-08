# Publishing AgentFast to npm safely

AgentFast has official versioned, tested [GitHub Releases](https://github.com/Brinkhagen/agentfast/releases). **Being available on GitHub does not mean it is published on npm.**

The workflow [`publish-npm.yml`](../.github/workflows/publish-npm.yml) is **manual only** and intentionally requires a trusted-publisher link between the npm package and this exact GitHub repository. It does not store or request npm access tokens.

## Step 1 — first publication (npm account owner)

An npm account that **owns the `@brinkhagen` scope** must perform the initial package publication. The GitHub integration cannot authenticate as the npm scope owner, and the trusted publisher generally cannot be configured before the npm package exists.

1. Log in to [npmjs.com](https://www.npmjs.com/) and verify the account owns `@brinkhagen` (individual username or organization scope). If someone else owns that scope, choose a legitimately owned scope instead; do not impersonate it.
2. From a trusted checkout of a verified GitHub release tag (for example `v0.4.0`), check `git status`, `npm ci`, `npm run verify`, and `npm pack --dry-run`.
3. Run `npm login` interactively and finish the account's required 2FA.
4. Run `npm publish --access public` for the **first release version not already present on npm**. npm versions are immutable: do not retry a published version.
5. Verify the public package page. A first publication is a privileged account action and cannot be completed from an unrelated GitHub app connection.

The package name is `@brinkhagen/agentfast`, and `package.json` already declares `publishConfig.access=public`.

## Step 2 — configure trusted publishing

On the npm package page: **Settings → Trusted publishing → Add trusted publisher → GitHub Actions**.

- GitHub owner: `Brinkhagen`
- GitHub repository: `agentfast`
- Workflow filename: `publish-npm.yml`
- GitHub environment name: leave blank (the workflow does not use one)
- Allowed actions: explicitly enable **npm publish** if the npm UI offers a choice (some accounts default to stage-only)

See the [official npm trusted publisher documentation](https://docs.npmjs.com/trusted-publishers/) for current controls, OIDC details and initial-configuration expiry.

## Step 3 — publish future versions with provenance

After the trusted publisher is configured and verified:

1. Merge a reviewed version bump with full CI and CodeQL.
2. Wait until the GitHub Release exists and its tagged commit has passed verification.
3. Open GitHub Actions → **Publish npm (manual, trusted publisher)** → **Run workflow**.
4. Enter the **existing GitHub release version** (without the leading `v`, for example `0.5.0`).
5. Confirm a successful workflow and that `npm view @brinkhagen/agentfast version` shows the expected value.

This workflow checks out exactly the published GitHub tag, verifies package and lockfile versions, runs `npm ci`, all tests, the reproducible demo and package dry-run, then uses npm's OIDC publishing with provenance. It cannot publish unless the npm account has authorized that exact workflow. npm does not allow a version to be overwritten.

## Troubleshooting

- **404 or missing package:** It may not exist in npm, or the scope may not be owned by the publisher.
- **403 / OIDC authorization error:** Configure the exact npm trusted publisher and allow direct publishing.
- **Version already exists:** Choose a newer reviewed release version. Do not mutate an immutable npm version.
- **GitHub Release exists but npm does not:** The two publishing pipelines are independent.

Until an npm page and an actual successful publish are verified, say **"npm publication pending"**, not "published".
