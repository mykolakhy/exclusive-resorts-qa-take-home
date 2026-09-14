# Exclusive Resorts QA take-home

This repository contains a risk-based QA assessment for the Exclusive Resorts “Request More Information” form. It combines exploratory findings, a focused test design, safe Playwright automation, a guarded Postman/Newman collection and a GitHub Actions workflow.

The target used during the assessment was:

```text
https://public-site.stage.exclusiveresorts.com/inquire/
```

The URL contains `stage`, while the supplied task describes the environment as production. Until isolation is explicitly confirmed, all automated lead-capable browser writes are intercepted and the API collection remains blocked. No real candidate contact data or secrets are stored in this repository.

## Requirements

- Node.js 22 or a compatible current LTS release
- npm
- Chromium and WebKit browsers installed by Playwright

## Install

```bash
npm ci
npx playwright install chromium webkit
```

For a Linux CI runner, install the browser system dependencies as well:

```bash
npx playwright install --with-deps chromium webkit
```

## Run the checks

```bash
# TypeScript validation
npm run typecheck

# Full Playwright suite in Chromium and WebKit
npm run test:e2e

# Focused suites
npm run test:smoke
npm run test:regression
npm run test:negative

# List tests without running them
npm run test:list

# Guarded Postman/Newman collection
npm run postman:check
```

`BASE_URL` can be overridden for an approved isolated target:

```bash
BASE_URL=https://approved-test.example/inquire/ npm run test:e2e
```

The Playwright configuration generates an HTML report in `playwright-report/`. Failure traces, screenshots and videos are written under `test-results/`; these generated directories are ignored by Git.

## Safety model

The request-interception fixture is installed before form interaction. It identifies lead-capable `POST`, `PUT` and `PATCH` requests, records the request for assertions, and returns a deterministic stub response instead of forwarding the write. This allows request-count and payload checks without creating CRM leads.

The Postman collection uses the same principle at the contract level. `postman/environment.json` contains the redacted endpoint and body shape captured in native Chrome, but starts with `contractCaptured=false`, so Newman skips every request. It becomes runnable only after the contract is approved for an isolated environment and any required session setup is provided separately. Keep all payload examples synthetic.

## Current results

| Area | Result |
| --- | --- |
| TypeScript | `npm run typecheck` passes. |
| Playwright | 12 ordinary checks pass in Chromium and WebKit; BUG-03 is visible as 2 expected failures; 4 cases are documented `fixme` checks. |
| Browser Network capture | Controlled synthetic checks recorded `POST /submit-form/`, `200 OK`, the redacted body shape and `{data:{id:<redacted>}}`; EXP-05 also showed malformed `Phone=123` receives `200 OK`. CRM delivery remains unverified. |
| Newman | Safety run exits successfully with 6 guards, 0 HTTP requests and 0 failures. This is not API behavior evidence. |
| CI | GitHub Actions workflow installs dependencies and browsers, runs typecheck and Playwright, and uploads reports and failure artifacts. |

See the [Playwright execution record](docs/playwright-results.md), [Postman result record](docs/postman-results.md) and [CI result record](docs/ci-results.md) for details.

## Findings and limitations

The confirmed findings are documented in the [bug report](docs/bug-report.md):

- **BUG-01:** conditional contact-preference dropdowns cannot be operated with the keyboard.
- **BUG-02:** the phone input is not programmatically associated with its label or validation error.
- **BUG-03:** rapid double activation emits two lead-capable requests at the UI/request layer.
- **BUG-04:** the submit endpoint accepts the client-invalid phone value `123` with `200 OK`.

The visible success flow was executed once with candidate-provided data and twice with synthetic UI submissions. Native Chrome DevTools captured the browser-level endpoint, payload shape, status and response shape; [EXP-02](docs/evidence/EXP-02-network-capture.md) records the baseline capture, [EXP-04](docs/evidence/EXP-04-backend-phone-acceptance.md) records valid-phone acceptance, and [EXP-05](docs/evidence/EXP-05-backend-invalid-phone-acceptance.md) records `Phone=123` also receiving `200 OK` through a direct synthetic request. The repository does not claim CRM delivery, downstream notifications or broad server-side validation coverage. TC-002 and TC-014 remain `fixme` because the live custom phone/radio controls do not have a stable headless interaction path for those assertions; the reasons and evidence are recorded in the [execution record](docs/playwright-results.md).

Load testing, repeated live submissions, stored-XSS verification, real-device coverage, spoken screen-reader output and downstream CRM/email/SMS delivery are outside this assessment's verified scope.

## Repository guide

- [`tests/`](tests/) — Playwright specs, page object and fixtures.
- [`postman/`](postman/) — guarded collection, environment and Newman instructions.
- [`docs/preparation.md`](docs/preparation.md) — environment, data and safety assumptions.
- [`docs/exploratory-notes.md`](docs/exploratory-notes.md) — exploratory observations.
- [`docs/test-plan.md`](docs/test-plan.md) — scope, risk model and approach.
- [`docs/test-cases.md`](docs/test-cases.md) — prioritized manual, UI and API cases.
- [`docs/bug-report.md`](docs/bug-report.md) — reproducible findings and impact.
- [`PLAN.md`](PLAN.md) — assessment stages and completion status.
- [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) — CI definition.

## Further improvements

1. Validate the captured contract in an approved isolated environment and enable the guarded Postman scenarios there.
2. Stabilize interaction with the custom phone and contact-method controls, then enable TC-002 and TC-014.
3. Re-test BUG-03 after a submission lock or idempotency fix and verify the server/CRM side with a safe test lead.
4. Add screen-reader and real-device checks after the label/error semantics are corrected.
5. Add a separate, explicitly authorized performance suite against a non-production target; do not use repeated live lead submissions for it.
