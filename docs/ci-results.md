# CI workflow

The repository now includes [`.github/workflows/playwright.yml`](../.github/workflows/playwright.yml).

The workflow runs on pushes, pull requests and manual dispatch. It checks out the repository, installs the locked Node.js dependencies, installs Chromium and WebKit, runs TypeScript typechecking and executes the Playwright suite. The HTML report, traces, screenshots and videos are uploaded as a workflow artifact when available.

`BASE_URL` is explicit and can be changed at workflow level without changing tests. Lead-capable browser writes are intercepted by the Playwright fixture, so the CI job does not create CRM leads.

Local workflow-equivalent verification:

- `npm run typecheck` — passed.
- `npm run test:e2e` — exit code 0; 14 tests passed according to Playwright (including the two expected BUG-03 failures), 4 tests skipped as documented `fixme` cases.
- The first local browser attempt was blocked by the desktop sandbox process policy; the rerun with browser-process access completed with the result above. This is an execution-environment limitation, not a test assertion failure.
