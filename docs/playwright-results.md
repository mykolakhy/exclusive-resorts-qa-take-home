# Playwright execution record

## Run summary

Date: 2026-09-13

Commands executed:

```text
npm run typecheck
npx playwright test
```

The type check completed successfully. The Playwright run completed with exit code 0 in Chromium and WebKit:

| Result | Count | Notes |
| --- | ---: | --- |
| Passed | 12 | TC-001, TC-003, TC-005, TC-009 and TC-011 across both browsers. |
| Expected failure | 2 | BUG-03 in Chromium and WebKit. The assertion expects one request after rapid double activation; the intercepted result is two. `test.fail` keeps the defect visible without failing the suite. |
| Skipped (`fixme`) | 4 | TC-002 and TC-014 in both browsers; reasons below. |

## Suite design and safety

- Every test that can activate Submit installs request interception before page interaction.
- Interception captures lead-like write requests and returns a deterministic stub response; it never forwards a lead-capable write request to the real environment.
- Test data is synthetic. No candidate-controlled contact details, cookies or tokens are stored in the suite or reports.
- Chromium and WebKit are configured in [playwright.config.ts](../playwright.config.ts). HTML reports, traces, screenshots and video-on-failure are generated locally and ignored by Git.

## Known execution limits

### TC-002 valid submit

The test and interception are implemented but marked `fixme`. In headless Chromium and WebKit, the form's custom phone/radio controls reset their Vue form-model state after native values are set, despite the native elements reflecting those values. The controlled manual LIVE-01 submission succeeded through the visible UI, and the redacted browser contract is documented in EXP-02, so this remains an automation limitation rather than a product defect. Re-enable TC-002 once a stable interaction path is available.

### TC-014 name boundary

The test is marked `fixme` because the explicit 51-character message is only reachable through the same form-level validation path blocked by TC-002. Manual exploratory evidence remains the source for this boundary behavior.

### BUG-03 duplicate request risk

The regression test intentionally double-activates Submit with synthetic data and expects one intercepted lead-capable request. It observes two in both browsers. This is documented in [the bug report](bug-report.md#bug-03--rapid-double-activation-emits-duplicate-lead-capable-requests). Backend idempotency and CRM delivery remain unverified.
