# Exploratory notebook

Status: client-side investigation documented; one controlled LIVE-01 submission, two controlled synthetic UI/server submissions (EXP-02 and EXP-04), and one direct synthetic backend-validation request (EXP-05) completed, plus one blocked EXP-03 submit attempt. The visible success flow and browser-level submit contract were verified; CRM delivery remains unverified.

## Session context

- Session ID: EXP-01.
- Date: 2026-09-13; observations span separate interaction segments on this date. No claim is made about uninterrupted testing duration.
- Tester: AI-assisted exploration for the candidate; all reported actions were performed against the live form.
- URL: https://public-site.stage.exclusiveresorts.com/inquire/.
- Environment: macOS 26.5.2; Codex In-app Browser and native Google Chrome. Installed Chrome package: 152.0.7977.83; active process version not independently verified.
- Viewports: default desktop view and 375 × 812. Chrome responsive emulation independently confirmed the mobile layout and keyboard finding.
- Cookies: necessary-only choices confirmed; optional functional/tracking choices left off.
- Data: SYN-01 for non-submitting input checks; LIVE-01 for the candidate-provided submission, kept out of repository files; EXP-02, EXP-03, EXP-04 and EXP-05 used synthetic data only.
- Objective: investigate lead-entry integrity, validation, consent, usability and accessibility before writing test cases or automation.

## Observation log

| ID | Area / action | Observed result | Assessment |
| --- | --- | --- | --- |
| OBS-01 | Inspect initial form | Separate inputs named `FirstName` and `LastName`; both are required. Submit initially disabled during initialization, later enabled. | Update test design to match the actual structure and contract. |
| OBS-02 | Empty Submit | Required errors for first/last name, email, postal code, phone and contact method; general error message. A repeat with Fetch/XHR recording active showed no `/submit-form/` request. | Client validation blocked the empty form before the submit request. |
| OBS-03 | Phone / Text / Email radios | Mutually exclusive; time/day preferences shown for Phone only and hidden for Text/Email. Text did not automatically select SMS opt-in. | Resolves preparation question Q-03. |
| OBS-04 | Open preference lists | Options match the PDF; mouse selection changes displayed values. | Expected UI behavior. |
| OBS-05 | Operate preference lists with keyboard | Focus reaches generic controls, but Enter/Space/ArrowDown do not enable selection. Independently reproduced in Chrome. | BUG-01. |
| OBS-06 | Inspect phone label and error relationships | Missing associated label, description/error linkage and invalid-state attribute. | BUG-02. |
| OBS-07 | Paste abcd and +48123abc into cleared phone | Strings rejected; required error remains. | No phone-letter acceptance bug reproduced. |
| OBS-08 | Phone 123, then an international-format synthetic number | Short number gets a validity error; the synthetic international number formats without that error. A controlled short-form submission carrying a valid synthetic international phone returned `200 OK` and reached the success step. | Backend acceptance confirmed for this request path; CRM delivery remains unverified. |
| OBS-09 | Malformed email samples | UI rejects foo.com and the actually entered foo@foo@. A synthetic example.com address also yielded Email is not valid on Submit. | Exact email acceptance rule remains to be established. |
| OBS-10 | Whitespace and Unicode name | Whitespace-only name rejected; Олена 🧪 showed no error after blur. | Client behavior only. |
| OBS-11 | Name length 50 / 51 / 1000 | 50 characters are accepted after leaving the field; 51 and 1000 produce the explicit 50-character limit error. | The relevant upper boundary is 50 accepted / 51 rejected. |
| OBS-12 | HTML/XSS sample in name, no Submit | Literal sample displayed and rejected as an unallowed value; no alert observed. | Limited client-input check; no backend or CRM security claim. |
| OBS-13 | Postal formats | !@# rejected; 10001, SW1A 1AA, 00-001 and K1A 0B1 showed no error after blur. | Client format coverage. |
| OBS-14 | Otherwise populated LIVE-01, consent off | General error and red consent styling; no lead-creation request observed in Chrome Fetch/XHR view. | Client enforcement observed; UX-01. |
| OBS-15 | Mobile 375 × 812 | Chrome uses mobile navigation; stacked fields and conditional controls fit and remain reachable. | In-app-only header clipping excluded from confirmed defects. |
| OBS-16 | Console inspection | Hydration mismatch and payload-preload warnings observed in both browsers. | Technical follow-up, not a demonstrated business failure. |
| OBS-17 | Direct backend request with UI-invalid phone `123` | DevTools Console `POST` with `Phone=123` returned `200 OK` and an internal-id response shape; the UI itself had shown a phone validity error. | BUG-04. |

Evidence: [transcribed UI/DOM observations](evidence/EXP-01-ui-observations.md). Formal findings: [bug report](bug-report.md).

## Request observations

The first LIVE-01 submission was performed in the in-app browser, where the adapter did not expose network interception. A separate controlled synthetic EXP-02 submission was performed in native Chrome with DevTools attached before interaction. A later controlled synthetic EXP-04 submission verified backend acceptance of a valid international phone. EXP-05 then used one direct synthetic browser request to test the server response for the UI-invalid value `Phone=123`; this bypassed only the client-side gate so the server-side rule could be isolated. The redacted evidence is in [EXP-02](evidence/EXP-02-network-capture.md), [EXP-04](evidence/EXP-04-backend-phone-acceptance.md) and [EXP-05](evidence/EXP-05-backend-invalid-phone-acceptance.md).

EXP-02 captured `POST https://public-site.stage.exclusiveresorts.com/submit-form/` as a Fetch/XHR request. The request used `application/x-www-form-urlencoded` and carried a JSON wrapper with a URL-encoded `values` member and `form: SHORT_FORM`; it returned `200 OK` with `application/json` response shape `{ "data": { "id": "<redacted>" } }`. Cookies, generated identifiers and contact values are excluded from repository files.

The capture also showed an attempted `https://public.awsprod.exclusiveresorts.com/fb-events` Fetch/XHR request failing with a CORS `AllowOriginMismatch` error. The form submit still returned `200 OK` and advanced to the success step; CRM delivery was not verified.

## Submission / attempt ledger

**Four UI validation attempts plus one controlled LIVE-01 submission, two controlled synthetic UI/server submissions (EXP-02 and EXP-04), one direct synthetic backend-validation request (EXP-05), and one blocked EXP-03 attempt.** EXP-02, EXP-04 and the LIVE-01 flow reached the site's visible success step; EXP-05 was a direct request and did not rely on the UI success flow. The records capture browser/backend responses but none proves CRM delivery.

| ID | Date | Purpose | Data | Result / network visibility |
| --- | --- | --- | --- | --- |
| ATT-01 | 2026-09-14 | Empty Submit rerun with Network recording | Empty form | Client required errors appeared for the required fields and contact method; Fetch/XHR recording showed no `/submit-form/` request. |
| ATT-02 | 2026-09-14 | Synthetic populated form, consent off rerun with Network recording | Synthetic values; Email method; required consent off; SMS off | The form showed the general submission error while the required consent remained unchecked; Fetch/XHR recording showed no `/submit-form/` request. |
| ATT-03 | 2026-09-14 | Keyboard Enter on empty form rerun with Network recording | Required fields empty | Enter produced the client required-field errors and contact-method error; Fetch/XHR recording showed no `/submit-form/` request. |
| ATT-04 | 2026-09-13 | Isolated missing-consent check | LIVE-01, contacts redacted | General error and consent styling; observed Chrome Fetch/XHR requests were content preloads only. |
| ATT-05 | 2026-09-13 | Controlled real baseline submission | LIVE-01, contacts redacted; Email method; required email/privacy consent on; SMS off | After a brief `SENDING...` state, the page displayed “We appreciate your interest. A Membership Director will connect with you shortly.” The site then presented an optional referral/professional-details form. The flow established the submit contract as `POST /submit-form/` with a `200 OK` JSON response. CRM delivery was not verified. |
| ATT-06 | 2026-09-13 | Controlled synthetic baseline with native Chrome Network capture | EXP-02; synthetic values only; Email method; required email/privacy consent on; SMS off | DevTools recorded `POST /submit-form/` as Fetch/XHR; response was `200 OK` with JSON `{data:{id:<redacted>}}`; the browser advanced to the success step. The separate `fb-events` request failed with a CORS error. |
| ATT-07 | 2026-09-14 | Controlled synthetic server-side phone-acceptance check | EXP-04; synthetic values only, including a valid international phone; Email method; required email/privacy consent on; SMS off | DevTools recorded `POST /submit-form/` with `200 OK` and JSON `{data:{id:<redacted>}}`; the browser advanced to the success step. The separate `fb-events` request failed with a CORS error. |
| ATT-08 | 2026-09-14 | Controlled synthetic negative backend phone-validation check | EXP-05; direct browser request with `Phone=123`; all other values synthetic | The submit endpoint returned `200 OK` with JSON `{data:{id:<redacted>}}`. This confirms acceptance of a client-invalid phone value on this request path; CRM persistence and downstream processing remain unverified. |

The required live baseline checkbox was selected only for ATT-05; the SMS opt-in remained unselected.

## Findings and test-design implications

- Current confirmed findings: keyboard-inoperable preference lists, missing phone-label/error associations, and malformed-phone submission/acceptance (BUG-04). The earlier duplicate-request observation (BUG-03) was not reproduced after correcting the test setup. The automated phone recheck adds UI evidence to BUG-04 without another live submission.
- Additional UX observations: missing specific consent-error text and a placeholder-only last-name label.
- Treat browser-adapter failures separately from product behavior; use real focus and visual confirmation for keyboard checks.
- Cover separate first/last-name requirements, the 50-character name boundary, conditional preferences, and independent email/SMS consent states.
- UI stubs now follow the redacted observed submit contract; they still do not establish CRM delivery or server-side validation.

## Remaining investigation

1. Do not complete the optional post-success referral/professional-details form because it would create additional personal-data processing outside the requested baseline.
2. Verify the redacted contract against an explicitly isolated target before enabling Postman/Newman; the current repository guard remains closed. EXP-05 is a browser-level negative check, not approval for general API replay.
3. Investigate slow/error responses and double-submit only with a verified interception/blocking path that prevents additional leads. The live browser baseline did not test these behaviors.
4. If the CORS analytics failure is in scope, confirm its impact separately without replaying the lead submit.

The Playwright suite and stage 3 test-design baseline are in [test cases](test-cases.md). Responsive behavior was checked with Chrome viewport emulation at 375 × 812; testing on a physical phone or tablet, screen-reader speech, server-side XSS behavior, CRM delivery and broader direct API validation remain unverified. The single negative phone-validation check is documented as BUG-04.
