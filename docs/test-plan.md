# Test plan

## Objective

Verify that the Exclusive Resorts “Request More Information” form accepts valid lead data, rejects invalid or incomplete data, preserves the consent rules, remains usable at the target viewport, and exposes enough semantics for keyboard and assistive-technology users. The plan separates client behavior from server, CRM and messaging outcomes.

## Scope

The scope covers:

- page loading and availability of the form's required controls;
- required-field validation for first name, last name, email, postal code, phone and preferred contact method;
- email and phone syntax, international phone formatting, name length, Unicode and free-text security input;
- US and international postal-code examples;
- Phone, Text and Email contact-method behavior, including the Phone-only conditional time/day preferences;
- required email/privacy consent and independent optional SMS opt-in;
- mouse, keyboard, focus, accessible names, error associations and a 375 × 812 viewport;
- one candidate-controlled visible success flow and one separate synthetic Network-capture flow already executed manually;
- payload, request-count and response assertions in isolated Playwright/API tests using the redacted observed submit contract; live API replay remains blocked.

## Out of scope

- CRM lead delivery, email delivery, SMS delivery and downstream membership workflows;
- repeated real submissions, load or endurance testing, and the PDF's ambiguous repeated-request performance example against a live target;
- a full security audit, penetration testing, stored-XSS verification or destructive payloads against the live environment;
- real-device coverage, spoken screen-reader output and assistive-technology conformance beyond the observed keyboard/DOM checks;
- general direct API execution until the endpoint and an isolated target are confirmed; the single browser-level negative check is recorded separately as BUG-04;
- completing the optional post-submit referral and professional-details form.

## Risk model and priorities

Priority reflects the risk to a prospective lead and the safety of the test itself.

| Risk | Why it matters | Priority | Coverage |
| --- | --- | --- | --- |
| A valid lead is rejected or silently lost | Direct conversion and business follow-up are affected. | P0 | TC-001, TC-002, TC-003, TC-004 |
| Rapid repeated activation creates duplicate lead requests | A non-idempotent backend could create duplicate follow-up work or leads. | P1 | TC-002 request count; BUG-03 regression check |
| Required consent is bypassed or optional SMS consent is coupled incorrectly | Creates legal/compliance and trust exposure. | P0/P1 | TC-005, TC-006, TC-007 |
| Invalid contact data reaches the lead flow | Follow-up cannot reach the prospect or pollutes CRM data. | P1 | TC-008, TC-009, TC-010, TC-011, TC-016; BUG-04 |
| Keyboard or assistive-technology users cannot complete or correct the form | The exploratory session already reproduced two accessibility defects. | P1 | TC-012, TC-013 |
| Boundary, international or mobile inputs regress | Valid prospects may be excluded in common locales and devices. | P2 | TC-014, TC-015 |

## Test approach

### Manual exploratory and accessibility checks

Use a clean form with synthetic values for validation and interaction checks. Repeat confirmed defects in a second browser or viewport when possible. Record visible state, focus target, accessibility tree/DOM relationships and console evidence separately from assumptions. Use the single candidate-controlled LIVE-01 submission only as the recorded visible success baseline; do not repeat it.

### Playwright UI checks

Automate the P0 and stable P1 cases with synthetic data. Install `page.route()` before any form interaction, identify every request capable of creating a lead, and return a deterministic success or validation response. Assert request count, payload fields and visible UI state. Run the selected suite in Chromium and WebKit with isolated contexts. Tag tests `@smoke`, `@regression` and `@negative` according to the case table.

### API checks

Create Postman/Newman cases from the redacted browser contract, but execute them only after the target is confirmed isolated and any required session setup is supplied separately. Keep the collection guard closed by default; never store cookies, tokens or real contact details in the repository.

## Entry criteria

- the target URL is reachable and the form can be loaded;
- synthetic data and a request-interception strategy are available for automated tests;
- a safe, isolated endpoint is confirmed before any repeated API or negative-server checks;
- the expected success contract is documented from the observed application or an approved stub.

## Exit criteria

- every P0 case has a documented result or an explicit environment blocker;
- all P1 cases have a result, a linked defect or a justified automation/manual decision;
- P2 coverage is recorded with its boundary and locale assumptions;
- confirmed defects have reproducible steps and evidence;
- no real contact data, secrets or unreviewed captures are included in the deliverable;
- unresolved server, CRM and real-device gaps are stated in the README and final walkthrough.

## Current status

Exploratory coverage and the controlled visible success flows are complete. BUG-01, BUG-02, BUG-03 and BUG-04 are confirmed at the UI/request layer. EXP-02 and EXP-04 captured the browser submit endpoint, payload shape and response shape; EXP-05 confirmed that a direct request with client-invalid `Phone=123` still receives `200 OK`. CRM delivery, broader negative validation and downstream processing remain unverified, so general live API execution stays blocked. The intercepted happy-path test is implemented but marked `fixme` until the custom phone/radio controls have a stable headless interaction path; this is tracked as an automation limitation, not a product defect. See the [execution record](playwright-results.md) for the two-browser result.
