# QA Take-Home Assessment Execution Plan

Source of requirements: [QA Take Home Assessment.pdf](./QA%20Take%20Home%20Assessment.pdf).

Goal: prepare a complete Senior QA-level solution with risk-based prioritization, evidence-based findings, stable automation and clear communication.

**Focus: complete risk coverage, implementation quality and verified results.** A stage is considered complete when its acceptance criteria have been met. Deliverables for the company are written in English. Core stack: Playwright + TypeScript, Postman/Newman and GitHub Actions.

## Sequence and results

| Stage | Actions | Result |
| --- | --- | --- |
| 1. Preparation — completed | Verify environment availability; record the browser, date, URL, test data and limitations; prepare a place for notes. | [Test conditions and questions/assumptions](docs/preparation.md). |
| 2. Exploratory testing — completed | Explore the form with Network/Console, check the main flow and risk areas, collect evidence and verify controlled submissions. | [Notes](docs/exploratory-notes.md), [bug report](docs/bug-report.md) and [evidence](docs/evidence/EXP-01-ui-observations.md), [EXP-02 Network capture](docs/evidence/EXP-02-network-capture.md); the success flow and browser-level endpoint/payload/response were captured, while CRM delivery was not verified. |
| 3. Test design and bug reports — completed | Define scope/out-of-scope and risks from the research, create 12–15 cases and document confirmed defects. | [Test plan](docs/test-plan.md), [test cases](docs/test-cases.md) and [bug report](docs/bug-report.md). |
| 4. Playwright — completed | Build the minimum structure, automate at least five priority cases, configure request interception, two browsers, tags and reports. | [Playwright execution record](docs/playwright-results.md), `playwright.config.ts`, `tests/`; 22 ordinary passes, 2 expected BUG-04 failures and no skipped checks; valid submit and name boundaries pass. |
| 5. Postman/Newman — prepared with a blocker | Create a baseline from the real request and negative/boundary variants; add assertions and environment parameters. | [Collection](postman/collection.json), [environment](postman/environment.json), [stage record](docs/postman-results.md) and [EXP-02 capture](docs/evidence/EXP-02-network-capture.md); the observed contract was transferred with redaction, but all requests remain blocked by default. |
| 6. CI — completed | Add dependency and browser installation, run Playwright and retain reports/traces. | [Workflow](.github/workflows/playwright.yml) and [verification result](docs/ci-results.md). |
| 7. README — completed | Document installation, run commands, smoke/regression, Newman, CI, limitations and further improvements. | [Root README](README.md); key commands were verified locally. |
| 8. Final verification — completed | Verify the README-based run, result completeness and final safety checks. | [Verified package](docs/ci-results.md) and final safety checks. |

## 1. Preparation and environment rules

- The local Git repository was initialized on the `main` branch and `.gitignore` was created. Add the lockfile alongside the dependencies during Playwright setup; inspect the repository contents or prepare a ZIP before handoff.
- The document describes the environment as production, although the URL contains `stage`. Until isolation is confirmed, consider the possibility of creating real CRM leads.
- Prepare recognizable synthetic candidate data; use controlled contact details rather than contacts belonging to third parties.
- Plan one valid submission for the baseline; make additional real submissions only when specifically needed, keeping the total within a few for the entire task.
- Do not run the API collection or cyclic POST requests automatically against production. Parameterize the environment URL; leave active server-side security checks and repeated calls for a confirmed test environment unless their safety has been established.
- Document CAPTCHA, CSRF, rate limiting and other blockers. Investigate the cause, capture evidence and possible ways to unblock them; continue independent parts of the work separately.

## 2. Exploratory testing — before writing cases and automation

Research areas:

- form structure, actual fields and options, required flags, initial state and the main flow. Record differences from the PDF.
- empty fields, email, inserting letters into the phone field, `+`, international codes, spaces, long values and Unicode; independence of consent and SMS opt-in.
- keyboard, focus, label-to-field associations, error messages and a 375 px viewport.
- one controlled valid submission and request/response analysis; observe button state, success behavior and going back. Investigate repeated activation and slow/error responses with controlled interception to avoid creating unnecessary leads.
- recheck the most important findings and complete the notes.

For each finding, preserve reproducible steps, expected/actual results, the environment and evidence. Separate confirmed bugs, UX observations and questions about requirements. If no defects are found, describe the areas explored and the basis for the conclusion honestly; do not invent a bug to reach a target count.

## 3. Test design and priorities

Form the final 12–15 cases after exploratory testing. For each case, specify the ID, name, type, priority, preconditions/data, steps, expected result and verification method: manual, Playwright or API.

Required coverage:

- **P0:** form loading, valid submission, blocking without required fields and consent; an XSS check for the free-text field.
- **P1:** email and phone, payload accuracy, contact method, optionality of SMS opt-in, double activation, keyboard and labels.
- **P2:** international formats, long values, dropdown options and a 375 px viewport. Raise the priority if exploratory testing identifies a significant risk.

Record the boundaries separately: a UI test with a mocked response does not prove lead delivery to the CRM; a client-side XSS check does not prove the absence of stored XSS in the CRM. Load testing and a full security audit are outside this task's scope and require separate objectives and an appropriate test environment.

## 4. Playwright coverage

Initial automation selection, to be refined based on exploratory results:

1. The form loads and key fields are available.
2. Valid submit: the intercepted payload matches the entered values; after a mocked successful response, the UI shows confirmation.
3. Empty submission is blocked, errors are shown and no submission request is sent.
4. An invalid email is rejected.
5. Missing required consent blocks submission.

Determine additional coverage from the risks and exploratory results: inserting a non-numeric phone value, double activation and regression tests for significant findings. Justify the automated or manual approach for every important scenario. Ensure all components are covered: Playwright, Postman, documentation and final verification.

Technical requirements:

- `InquiryPage` and fixtures for data and network interception; use `getByRole`/`getByLabel` where possible.
- Install `page.route()` before interacting with the form; identify all requests that can create a lead precisely. Verify the payload, request count and absence of submission in negative scenarios.
- Build the mocked response from the observed contract. Do not describe these checks as end-to-end CRM verification.
- Chromium + WebKit, test isolation, controlled parallelism, CI retries, an HTML reporter and a trace on failure.
- Tags `@smoke`, `@regression`, `@negative`; state-based waiting without fixed pauses.
- File a reproducible product defect as a bug; if an expected test failure is required, link it explicitly to the BUG ID and do not hide it with weakened assertions.

## 5. Postman and API

- Preserve the real baseline: method, endpoint, required headers, body format, status and response structure. Do not publish cookies, tokens or personal data.
- Add variants: missing required field, invalid email, missing consent, unsupported HTTP method, international/boundary values and a security scenario with its safe execution conditions.
- Use `pm.test` for status, response time and JSON structure if the endpoint actually returns JSON. Document discrepancies with the task's expectations rather than inventing a contract.
- Configure an explicitly approved isolated target through `baseUrl` and `isolatedTargetOrigin`; the captured shared stage target remains blocked. Use placeholder values and no secrets. Add the exact Newman command to the README.
- Clearly mark which scenarios were executed, which were only prepared and which were blocked by infrastructure. If a clean Postman success is unavailable, describe the attempts, observations and next actions.
- The PDF's “p95 over 10 calls / all < 2000 ms” scenario is ambiguous: these are different criteria. Do not make 10 real submissions for illustration; document the limitation and the way to verify it in an isolated environment.

## 6. Handoff readiness criteria

- [x] Exploratory notes and a bug report exist in the ID / Title / Severity / Steps / Expected / Actual format.
- [x] Scope/out-of-scope, risks and 12–15 meaningful cases cover all required categories.
- [x] At least five cases are automated; the suite was run in two browsers, with results and limitations recorded.
- [x] All UI submissions are intercepted; the payload is verified and the automation does not create CRM leads.
- [x] A Postman collection and environment exist, and Newman was verified in blocked mode and against a local stub with negative response mutations; the status of actual API-test execution is documented.
- [x] A CI workflow exists; its local equivalent was verified, and reporting and limitations are documented. Enabling it in GitHub is not a mandatory PDF requirement.
- [x] README instructions were verified with a local run; smoke, regression and negative suites run separately.
- [x] Published materials contain no secrets or private data; the repository package was checked.
- [x] The confirmed BUG-04 rejection failure remains visible and explained; BUG-03 passes on recheck.

Be able to explain every added test, assertion and abstraction. AI use is permitted under the task requirements.
