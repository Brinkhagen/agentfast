# Community growth and adoption evidence

AgentFast's long-term value depends on other developers genuinely choosing to install, test and improve it. Our goals are trustworthy usage, reliable change-risk heuristics and an active maintainer feedback loop — **not inflated vanity metrics**.

## First public-beta launch cycle

| Stage | Concrete action | Evidence of completion |
| --- | --- | --- |
| Readiness | Reproduce demos, verify the versioned release and the cross-platform CI | Link to passing run and release asset |
| Discoverability | Accurate description, searchable GitHub topics, logo/visuals, clear install command | Public README and GitHub About settings |
| First feedback | Share a technical demo in one community whose posting rules permit it | Actual discussion and substantive feedback |
| External evaluation | Invite someone outside the maintainer's environment to try a clean install | Reproduction report or independently supplied fixture |
| Maintenance | Triage issues, write regression tests, ship documented fixes | Issues, PRs, CI evidence and versioned releases |
| Further outreach | Present lessons learned rather than reusing the same promo message | Technical article and actual before/after findings |

**Outreach venues:** Show HN (functioning demos only), DEV Community, relevant Reddit communities where project showcases are permitted, and relevant TypeScript/Node maintainer groups. Ask for technical feedback, not votes. The ready-to-use drafts are in [LAUNCH-KIT.md](LAUNCH-KIT.md).

## Record measurements honestly

- **GitHub stars** indicate bookmarks/interest, not installs or satisfied users.
- **GitHub Traffic** provides limited-window visitors and page views; do not add page views to release downloads.
- **Release downloads** count artifact downloads, including repeat downloads by the same user.
- **npm installs/downloads** should only be reported after an npm registry publication, using an explicit time window.
- **External usage** is strongest when tied to a real third-party repository, public dependency, CI configuration, or reproducible feedback.
- **External pull requests and issues** demonstrate participation, not always adoption.
- **Benchmarks** must name the baseline, environment, fixture and whether full CI continued to run.

As an early beta, **we do not claim any verified external adoption or measured token/runtime savings**. Update this document only with independently verifiable facts.

## Proposed public weekly report format

| Week ending | Real reported users/projects | Release downloads | External issues/PRs | Verified regressions fixed | Notes |
| --- | --- | --- | --- | --- | --- |
| To be measured | Not yet measured | Not yet measured | Not yet measured | Not yet measured | Start tracking when data is available |

## What *not* to do

Never buy or exchange GitHub stars, create fake accounts, run bots to inflate downloads, misrepresent traffic as users, coordinate voting on Hacker News, or present scripted demos as independent benchmarks. These tactics do not show ecosystem value and can harm trust in the project.

## Real maintainer work

The maintainers need reproducible test fixtures, code reviews, risk-classification regression tests, documentation updates, issue triage, release verification and checks for safety regressions. These are legitimate ongoing reasons to use coding assistance — regardless of whether any grant or sponsorship is awarded.

See [MAINTAINERS.md](../MAINTAINERS.md), [CONTRIBUTING.md](../CONTRIBUTING.md) and [ROADMAP.md](ROADMAP.md).
