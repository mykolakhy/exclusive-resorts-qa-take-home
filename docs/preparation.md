# Preparation record

Status: preparation completed. Exploratory testing and test design are now documented; see [the notebook](exploratory-notes.md) and [test plan](test-plan.md). Initial observations below remain the preparation record.

## Environment and availability

| Item | Recorded value |
| --- | --- |
| Observation date | 2026-09-13, Europe/Warsaw (CEST, UTC+02:00) |
| Local environment recorded at | 2026-09-13T01:42:48+02:00 |
| Requested and observed URL | https://public-site.stage.exclusiveresorts.com/inquire/ |
| Page title | Request More Information |
| Availability | Page and form controls loaded in the browser; no login prompt or blocking challenge was observed during this check. |
| Browser | Codex In-app Browser, default viewport; no responsive override applied. |
| Browser version | Not captured: the connection identifies the browser but does not expose navigator.userAgent in its read-only page inspection. Record exact engine/version for subsequent test runs. |
| Operating system | macOS 26.5.2, build 25F84, arm64 |
| Node.js / npm | v24.19.0 / 11.17.0 |
| Git | Local repository initialized on main; no commits or remote configured. |
| Backend / CRM availability | One candidate-provided submission and one separate synthetic submission reached the site's visible success step. Native Chrome captured the browser-level request contract for the synthetic run; CRM delivery was not verified. |

This was a navigation and initial-state check, not a smoke-test pass or an exploratory session. HTTP status, request timing and application build identifier were not captured. Browser-tool execution duration is not a website performance measurement.

## Initial observations

- The browser accessibility tree exposed Name, Email, Postal Code, Phone, a country-code selector, Phone/Text/Email contact-method choices, email/privacy consent, SMS opt-in and Submit.
- Submit was disabled in the initial state; contact-method choices and both consent checkboxes were unselected.
- Preferred Time of Day and Preferred Days were not present before a contact method was selected. Exploratory verification showed them for Phone only; they remained absent for Text and Email. This is conditional behavior, not a confirmed defect.
- A screenshot showed a cookie notice over the lower portion of the page, with Accept All and Cookie Preferences controls. During exploration, necessary cookies were confirmed while optional functional and tracking cookies remained disabled.
- No field values were entered and no submission was attempted. The availability check did not establish the form's validation rules or API contract.

## Working constraints

- Treat this environment as capable of creating real CRM leads: the assessment calls it production despite the stage hostname.
- Plan one clearly identifiable baseline submission during exploration, using candidate-controlled contact details. Log every actual submission; additional submissions must have a specific testing purpose and remain limited to a handful across the assessment.
- Automated UI submission requests must be intercepted before tests interact with the form, with payload and request-count assertions. This is a requirement for the automation stage, not a protection already implemented.
- Do not run a production Postman collection, repeated lead-creation requests or active server-side security probes automatically. Establish an isolated target for checks that may produce multiple leads or persist attack payloads.
- Record infrastructure blockers with evidence and a recovery path. Do not infer product defects from access restrictions or an undocumented API contract.
- Keep raw captures and actual contact details local. Only reviewed, redacted evidence belongs in the deliverable.

## Open questions and assumptions

| ID | Question / assumption | Resolution point |
| --- | --- | --- |
| Q-01 | Is the stage hostname isolated from production CRM, email and SMS systems? No isolation has been confirmed. | Before choosing direct API execution scope; meanwhile use production constraints. |
| Q-02 | Candidate-controlled name, email and phone were provided privately and used for LIVE-01. Actual values are omitted from repository files. | Contact data and required email/privacy consent were confirmed for the one baseline submission; SMS opt-in remained off. |
| Q-03 | Resolved during EXP-01: Time of Day and Days are displayed for Phone and hidden for Text/Email. | Observed in live UI interaction and screenshot review; include the Phone-only conditional behavior in the test plan. |
| Q-04 | What are the actual submit endpoint, authentication/anti-bot requirements, success response and validation contract? | Native Chrome EXP-02/EXP-04 observed `POST /submit-form/`, form-urlencoded content type, HTTP 200 and the response shape. EXP-05 also showed the server returning `200 OK` for client-invalid `Phone=123`, confirming a negative phone-validation gap; session requirements, broader negative rules and downstream processing remain unverified. |

No question has been sent to the company. Record any answers and their source here when available.

## Prepared workspace

- [Test data](test-data.md): synthetic values and the separate requirements for a live baseline.
- [Exploratory notebook](exploratory-notes.md): session context, observations, findings and submission ledger.
- [Evidence directory](evidence/README.md): naming and redaction conventions.
- Root .gitignore excludes dependencies, generated reports, secrets and unreviewed captures. Reviewed evidence and dependency lockfiles remain eligible for version control.
- Dependency installation and package-lock.json creation belong to the Playwright setup stage. No test cases or automation have been written in preparation.

## Preparation completion checks

- [x] Navigate to the specified URL and inspect the initial page state.
- [x] Record browser identity, date, OS and available local tooling, including unverified details.
- [x] Initialize the local Git repository and add ignore rules.
- [x] Prepare synthetic test data and identify missing inputs for live submissions.
- [x] Create a notebook and evidence location.
- [x] Document assumptions, environment constraints and open questions.

Exploration is documented through the candidate-controlled baseline, synthetic Network-capture submissions and the controlled negative backend check. See the notebook plus EXP-02, EXP-04 and EXP-05 evidence for the visible success result, browser contract, BUG-04 and remaining CRM limitations.
