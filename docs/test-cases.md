# Test cases

The cases below are the stage 3 design baseline. Values marked `SYN-01` are synthetic and safe for intercepted tests. A real submission must not be repeated for automation or API checks.

| ID | Title | Type | Priority | Preconditions / data | Steps | Expected result | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-001 | Form loads with required controls available | Smoke | P0 | Clean page load; SYN-01 available | Open the inquiry URL; inspect First Name, Last Name, Email, Postal Code, Phone, contact method, consent and Submit. | Form loads without a blocking error; required controls are present; submit is unavailable until the form is valid. | Playwright `@smoke`; Chromium + WebKit |
| TC-002 | Valid inquiry submits once and shows success | Functional / integration stub | P0 | Intercept lead-capable request before interaction; SYN-01; Email method; required email consent on; SMS off | Fill valid values; select Email; select required consent; activate Submit once. | Exactly one intercepted submit request has the expected field values and consent state; deterministic success response leads to the visible confirmation state. | Playwright `@smoke`; payload, request-count and UI assertions |
| TC-003 | Empty form is blocked with required errors | Negative validation | P0 | Clean form; request interception active | Activate Submit without entering data. | No lead request is sent; the control is disabled or each required field shows a useful error; focus/error behavior is consistent. | Playwright `@negative`; request count + UI |
| TC-004 | Free-text security sample is rejected safely | Security-oriented negative | P0 | Clean form; `<img src=x onerror=alert(1)>` in a name field | Enter the sample; blur the field; inspect rendered value and validation; do not submit to a live target. | Input is treated as text and rejected or safely encoded; no script executes; no live lead is created. | Manual + intercepted Playwright `@negative`; server-side XSS remains out of scope |
| TC-005 | Required email/privacy consent blocks submit when absent | Compliance negative | P0 | Otherwise valid SYN-01; Email method; consent off; request interception active | Fill all required fields; leave required consent off; attempt Submit. | No lead request is sent; the control is disabled or the consent control is identified as invalid with an associated message or equivalent accessible state. | Playwright `@negative`; linked to UX-01 |
| TC-006 | SMS opt-in remains independent and optional | Consent / functional | P1 | Otherwise valid SYN-01; required email consent on; SMS off | Submit with SMS off; then, in an isolated intercepted test, repeat with SMS on. | SMS off does not block a valid submission and is represented as false; when selected, only the SMS flag changes and the required email consent rule remains intact. | Playwright with two isolated contexts; no live repeat |
| TC-007 | Contact method controls are mutually exclusive | Functional | P1 | Clean form | Select Phone, then Text, then Email. | Exactly one method is selected at a time; time/day preferences appear only for Phone and remain hidden for Text/Email; Text does not auto-select SMS. | Playwright + manual exploratory |
| TC-008 | Valid email syntax is accepted | Validation | P1 | SYN-01 with controlled synthetic address | Enter a valid email; blur; complete remaining required fields. | No email validation error appears and the value is preserved for the intercepted payload. | Playwright `@regression` |
| TC-009 | Invalid email syntax is rejected | Negative validation | P1 | Values `foo.com`, `foo@foo@` and another malformed synthetic sample | Enter each sample and blur or submit in isolated contexts. | The UI identifies the email as invalid; no submit request is sent for a negative-only run. | Playwright `@negative` |
| TC-010 | Phone accepts valid international format | Validation / locale | P1 | Synthetic `510000000` with the Polish country selector, or an equivalent approved international test number | Enter/paste the number; blur; inspect formatting and error state. | Digits and international `+` are retained/formatted; no client phone error appears for the approved valid sample. | Playwright + manual |
| TC-011 | Phone rejects letters and too-short numbers | Negative validation | P1 | Samples `abcd`, `+48123abc` and `123` | Paste/type each sample; blur; inspect the field and accessibility state. | Alphabetic/mixed input is not accepted; too-short numeric input shows a validation error; error is associated with the field. | Playwright `@negative` + manual; BUG-02 regression |
| TC-012 | Time/day preferences are keyboard operable | Accessibility / regression | P1 | Phone selected; keyboard-only interaction | Tab to Preferred Time of Day and Preferred Days; use Enter/Space/Arrow keys; select values; inspect roles and current value. | Controls expose combobox/listbox semantics, can be opened and selected without a pointer, and remain labelled. | Manual accessibility; current result is BUG-01 |
| TC-013 | Labels, helper text and errors are programmatically associated | Accessibility / regression | P1 | Form loaded; induce phone and name errors | Inspect label/id relationships, accessible names, `aria-describedby` and invalid state; correct the error. | Phone and all visible errors are announced through the input's accessible relationships; invalid state clears after correction. | Manual DOM/AX; current result is BUG-02 |
| TC-014 | Name boundary, whitespace and Unicode behavior | Boundary / validation | P2 | First/last name values: whitespace-only, 50 characters, 51 characters, Unicode/emoji | Enter each value and blur; inspect errors and retained values. | Whitespace-only is rejected; 50 characters is accepted; a 51st character is prevented or rejected with the stated limit; supported Unicode is handled without corruption. | Playwright `@regression` + manual |
| TC-015 | Postal formats and 375 × 812 layout remain usable | Locale / responsive | P2 | Postal samples `10001`, `SW1A 1AA`, `00-001`, `K1A 0B1`; viewport 375 × 812 | Run each postal sample; scroll through the form; select contact method and consent; inspect clipping and reachability. | Accepted locale examples remain usable; no unexpected client error; all controls fit or are reachable by scrolling; no essential content is clipped. | Playwright viewport + manual responsive check |
| TC-016 | Server rejects a client-invalid phone value | API / negative validation | P1 | Approved isolated target; synthetic short-form body with `Phone=123`; no real contact data | Send one controlled request using the observed submit wrapper; inspect status and response; do not repeat against an unisolated target. | Server returns a validation response (for example, 4xx), no internal-id success response is returned, and the malformed lead is not accepted. | EXP-05 browser-level check currently fails as BUG-04; broader API execution remains guarded |

## Traceability to the assignment

| Assignment requirement | Cases |
| --- | --- |
| Form load and valid submit | TC-001, TC-002 |
| Required fields and consent blocking | TC-003, TC-005 |
| XSS/free-text check | TC-004 |
| Email and phone validation | TC-008–TC-011 |
| Contact method, optional SMS and conditional preferences | TC-006, TC-007 |
| Double-submit and request count | TC-002 request-count assertion; BUG-03 regression check |
| Keyboard and label accessibility | TC-012, TC-013 |
| International/boundary/mobile coverage | TC-010, TC-014, TC-015 |
| Server-side validation | TC-016; current result BUG-04 |

## Execution notes

- TC-002, TC-003, TC-005, TC-006 and TC-009 must intercept the submit request before any interaction and assert request count.
- TC-002 must verify the exact payload against the redacted contract documented in EXP-02 when its stable headless interaction path is restored; the live endpoint is not called by Playwright.
- The TC-002 implementation is currently marked `fixme`: the live custom phone/radio controls reset their form-model state in headless interaction despite native values being set. The isolated request interception remains implemented and is exercised by BUG-03; re-enable TC-002 when a stable interaction path is available, using the redacted EXP-02 contract.
- TC-014 remains a manual regression check until the form-level 51-character validation can be reached through the same stable successful-submit path.
- A separate `@regression` check is intentionally marked expected-failing for BUG-03: it double-activates Submit and asserts one request. This keeps the product defect visible without weakening the passing valid-submit check.
- BUG-01 and BUG-02 should remain visible as expected failing regression checks or manual findings until fixed; do not weaken assertions to make them pass.
- The candidate-controlled baseline submission is evidence for visible success behavior only. EXP-02 supplies browser-level contract evidence from synthetic data, but neither run substitutes for CRM verification.
- TC-016 is intentionally guarded by target isolation. EXP-05 is the single browser-level negative check: `Phone=123` received `200 OK`, so the case currently fails as BUG-04; do not convert this evidence into repeated live API traffic.
