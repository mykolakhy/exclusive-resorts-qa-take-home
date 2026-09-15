# Playwright execution record

## Run summary

Date: 2026-09-15. Local Chromium and WebKit.

```text
npm run typecheck
npx playwright test
npx playwright test --grep TC-002 --repeat-each=3 --workers=1
```

| Result | Count | Notes |
| --- | ---: | --- |
| Ordinary passes | 22 | Ten live-page scenarios plus two local fixture checks per browser, excluding BUG-04. |
| Expected failure | 2 | TC-011 reproduces BUG-04 in both browsers; only the final no-submit assertion is expected to fail. |
| Skipped | 0 | TC-002 and TC-014 are active. |
| Additional TC-002 repeats | 6 | Three successful runs per browser, without retries. |

Playwright reports `24 passed` because expected failures count toward its successful-run total. No tests are skipped.

## Review follow-up

- The counter now records only `/submit-form/`; the broader heuristic blocks other lead-like writes without counting them as submits. Email validation is stubbed separately.
- Negative checks observe a full one-second window instead of an immediately successful zero-count poll. A local regression test verifies that a delayed submit causes this assertion to fail. This is bounded observation, not a claim that a request can never appear later.
- Required-field and malformed-email tests assert specific visible errors, and field filling verifies retained values. The valid-submit count is checked after the success UI appears.
- TC-011 additionally clicks Submit with otherwise valid data and `Phone=123`. The visible error is confirmed, yet the form emits the invalid value. This is additional UI evidence for existing BUG-04; backend acceptance is still evidenced separately by EXP-05.

## Valid-submit repair

The previous TC-002 skip was an automation defect. Server-rendered fields were visible before Nuxt hydration attached their handlers. The test could fill native inputs before the form model was ready. It now waits for hydration without mutating application state.

The email field also has asynchronous validation. Tests with otherwise valid data now wait for FormKit's `data-complete="true"` attribute before Submit. The email-validation service is stubbed with `{ "valid": true }`, the shape consumed by the deployed client; native malformed-email validation remains active. This suite does not test the email-validation service itself.

The previous submit stub returned invented success flags. It now returns HTTP 200 with `{ "data": { "id": "qa-intercepted-lead" } }`, matching the response shape recorded in EXP-02. The identifier is synthetic.

TC-002 checks the POST method, `/submit-form/` endpoint, `SHORT_FORM` wrapper, decoded field values, consent, contact method, normalized phone, one submit request and the visible success message. The payload contains URL-encoded fields nested inside JSON, so those fields are decoded before exact assertions. The phone fixture uses an explicit international test number and selects its country through the UI before entering it. Retained digits are checked so auto-detection cannot silently invalidate another negative scenario.

## Other regression results

- TC-014 now verifies that 50 name characters are accepted and 51 produce the stated validation error without a submit request. The earlier test incorrectly assumed that the input must truncate the value to 50.
- BUG-03 is not reproduced with the corrected setup: double activation emits one submit request in both browsers, including with a 500 ms simulated response delay. The test waits for the success UI before checking the count. The historical report is retained with a recheck note; no server-side fix or idempotency behavior is inferred.

## Scope

Submit-capable tests install interception before interacting with the page. Submit responses and the email-validation service are mocked. No real lead submission is forwarded by these checks, and success here does not establish backend acceptance or CRM delivery. Other unrelated requests can continue to the network.

HTML reports, traces, screenshots and videos are generated locally and ignored by Git. These results were verified locally; GitHub CI has not yet run this revision.
