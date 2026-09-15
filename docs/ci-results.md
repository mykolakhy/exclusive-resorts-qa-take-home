# CI workflow

The repository now includes [`.github/workflows/playwright.yml`](../.github/workflows/playwright.yml).

The workflow runs on pushes, pull requests and manual dispatch. It checks out the repository, installs the locked Node.js dependencies, installs Chromium and WebKit, runs TypeScript typechecking and executes the Playwright suite. The HTML report, traces, screenshots and videos are uploaded as a workflow artifact when available.

`BASE_URL` is explicit and can be changed at workflow level without changing tests. Lead-capable browser writes are intercepted by the Playwright fixture, so the CI job does not create CRM leads.

Local workflow-equivalent verification, 2026-09-15:

- `npm run typecheck` — passed.
- `npx playwright test` — 22 ordinary passes and 2 expected BUG-04 failures, no skips, Chromium and WebKit (Playwright summary: 24 passed).
- `npx playwright test --grep TC-002 --repeat-each=3 --workers=1` — 6 passed without retries.

`npm run postman:test` also passes against a loopback server: seven request variants, fourteen response assertions, five configuration/guard checks and four broken-response modes. This command is included in CI.

These are local results. GitHub CI has not yet run this revision.
