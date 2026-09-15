# Exploratory findings

Date: 2026-09-13. Target: https://public-site.stage.exclusiveresorts.com/inquire/

Scope: client-side exploratory testing plus one controlled browser-level server-validation check. These findings do not establish CRM behavior or the broader API contract. Evidence excerpts and reproduction details: [EXP-01 UI observations](evidence/EXP-01-ui-observations.md).

## Confirmed defects

### BUG-01 — Contact-preference dropdowns cannot be operated with the keyboard

| Field | Details |
| --- | --- |
| Severity | Low |
| Area | Accessibility / contact preferences |
| Environment | Codex In-app Browser; independently reproduced in native Chrome responsive emulation at 375 × 812 on macOS 26.5.2. Installed Chrome package: 152.0.7977.83; active process version not independently verified. |
| Preconditions | Inquiry form loaded; no form submission or personal data required. |
| Steps | 1. Select Phone as Preferred Contact Method. 2. Focus its radio with a physical click and press Tab to reach Preferred Time of Day. 3. Press Enter, Space and ArrowDown. 4. Tab to Preferred Days and try Enter and ArrowDown. 5. Compare with clicking a dropdown and an option using the mouse. |
| Expected | Both preference controls can be opened, navigated and selected using the keyboard; their names, roles and current values are exposed to assistive technology. |
| Actual | Tab reaches generic Select containers, but the tested keys do not open/select options; ArrowDown scrolls the page. Mouse selection works. Inspected controls consist of generic div elements without combobox/listbox semantics; labels reference ids absent from the corresponding controls. |
| Impact | Keyboard users cannot set their preferred callback time or days. Controls are optional, so the entire submission flow is not claimed to be blocked. |
| Evidence | [Conditional contact preferences and native Chrome reproduction](evidence/EXP-01-ui-observations.md#conditional-contact-preferences). Regression coverage: TC-012. |

### BUG-02 — Phone input is not associated with its label or validation error

| Field | Details |
| --- | --- |
| Severity | Low |
| Area | Accessibility / phone validation |
| Environment | Live form in Codex In-app Browser on macOS 26.5.2; DOM and accessibility inspection with visual verification of the error. |
| Preconditions | Inquiry form loaded. |
| Steps | 1. Inspect the Phone input's accessible name and label association. 2. Enter 123 and leave the field. 3. Inspect the input's error-description and invalid-state attributes while the validation error is visible. |
| Expected | The visible Phone label, relevant helper text and displayed validation error are programmatically associated with the input; the invalid state is exposed. |
| Actual | The telephone input has an empty id, no associated label, no aria-label/aria-labelledby, an empty aria-describedby and no aria-invalid. A visible “Please enter a valid phone number” error appears without a programmatic association. The placeholder supplies fallback wording but does not connect the label or error. |
| Impact | Assistive-technology users lack the explicit field-label and error relationship available visually, making correction harder. Actual screen-reader speech was not tested. |
| Evidence | [Phone and last-name semantics](evidence/EXP-01-ui-observations.md#phone-and-last-name-semantics). Regression coverage: TC-011 and TC-013. |

### BUG-03 — Rapid double activation emits duplicate lead-capable requests

Recheck, 2026-09-15: not reproduced in Chromium or WebKit after correcting the test setup. The test now waits for hydration and email validation, mocks the documented submit response, delays that response during double activation, and observes exactly one submit request. The historical observation below is retained; it is not a currently confirmed duplicate-submit defect. No backend fix or idempotency behavior is inferred.

| Field | Details |
| --- | --- |
| Severity | Medium |
| Area | Submission integrity / duplicate leads |
| Environment | Playwright Chromium run against the live form with all lead-capable writes intercepted before interaction; synthetic data only. |
| Preconditions | Valid synthetic form data; Email selected; required email consent selected; SMS opt-in off; interception active. |
| Steps | 1. Fill all required fields. 2. Activate Submit twice in rapid succession. 3. Count intercepted lead-capable requests. |
| Expected | The first activation disables or otherwise guards the submission path; exactly one lead-capable request is emitted. |
| Actual | Two lead-capable requests were intercepted from the rapid double activation. Backend idempotency and CRM duplication were not tested. |
| Impact | If the backend is not idempotent, one user action could create duplicate lead processing or follow-up work. |
| Evidence | Historical Stage 4 Playwright request-count report. The current regression is passing without an expected-failure annotation; see the recheck above. |

### BUG-04 — Submit endpoint accepts a malformed phone value

Automation recheck, 2026-09-15: TC-011 reproduces the same malformed-phone issue through the UI in Chromium and WebKit. With all other fields valid and the phone error visible, an ordinary Submit click emits `POST /submit-form/` with `Phone=123`. The request is intercepted, so this adds client-side evidence to EXP-05 without another live submission. Only the final no-submit assertion is marked expected-failing; setup and visible-error assertions must pass normally.

| Field | Details |
| --- | --- |
| Severity | High |
| Area | Server-side validation / lead data integrity |
| Environment | Native Chrome DevTools against `https://public-site.stage.exclusiveresorts.com/inquire/`; one controlled direct browser request with synthetic values. |
| Preconditions | The form's client validation is visible for `Phone=123`; request blocking is disabled only for the isolated check. |
| Steps | 1. Enter `123` in Phone and observe the visible “Please enter a valid phone number” error. 2. From DevTools Console, send one `POST /submit-form/` request with the observed short-form wrapper and synthetic values, retaining `Phone=123`. 3. Inspect the Network response. 4. Re-enable request blocking after the check. |
| Expected | The server rejects the malformed phone with a validation response (for example, a 4xx) and does not accept the lead payload. |
| Actual | The endpoint returned `200 OK` with an `application/json` response shaped as `{ "data": { "id": "<redacted>" } }`. |
| Impact | Client-invalid phone values can enter the lead-processing path, creating unreachable or low-quality contact data. The response does not establish CRM persistence, deduplication or downstream delivery. |
| Evidence | [EXP-05 backend invalid-phone acceptance](evidence/EXP-05-backend-invalid-phone-acceptance.md). |

## UX observations and technical follow-ups

| ID | Observation | Evidence / limit | Follow-up |
| --- | --- | --- | --- |
| UX-01 | Missing mandatory consent is signalled by red styling and a general submission message, without a specific nearby textual error. | Reproduced in native Chrome with otherwise populated candidate-provided data. No lead request appeared in the observed Fetch/XHR view. | Add a specific associated error explaining that consent is required; verify announcement and focus behavior with a screen reader. |
| UX-02 | Last name has no persistent visible label; the Name label is associated only with the First input. | Last uses placeholder-derived naming. Both first and last name are individually required by the current UI. | Give both inputs explicit labels; clarify the PDF's single Name-field description. |
| OBS-01 | Hydration mismatch and Nuxt payload-preload messages appear in the console. | Observed in both browsers. No causal link to user-facing failure established. | Investigate rendering consistency separately; do not infer data loss from console messages alone. |

## Behaviors that should not be reported as defects

- Time and Days are conditional: visible for Phone, hidden for Text and Email.
- Phone rejects pasted alphabetic and mixed alphanumeric samples; a short numeric sample gets an error.
- Name length validation accepts 50 characters and rejects 51; an HTML/XSS sample is rejected on the client.
- Several international postal formats show no client-side error.
- The header clipping seen only in the in-app viewport did not reproduce in Chrome's responsive emulation.

## Submission and remaining verification

One controlled LIVE-01 submission was completed after the candidate confirmed the action. The site showed a disabled `SENDING...` state followed by “We appreciate your interest. A Membership Director will connect with you shortly.” It then opened an optional referral/professional-details step, which was left untouched. SMS opt-in remained off.

A separate controlled synthetic EXP-02 submission was captured in native Chrome DevTools. It confirmed `POST /submit-form/`, the raw body shape, `200 OK` and the JSON response shape. The redacted evidence is in [EXP-02](evidence/EXP-02-network-capture.md). The same action also produced a CORS `AllowOriginMismatch` error for the auxiliary `fb-events` request; the form submit itself completed.

EXP-04 later verified one happy-path server acceptance with a valid synthetic international phone, and EXP-05 confirmed that the malformed value `Phone=123` also receives `200 OK` through a direct synthetic request. CRM delivery, broader negative server-side validation and controlled failure/double-submit behavior remain unverified. No finding in this report assumes CRM delivery or broad server-side validation passed.
