# EXP-03 — Blocked submit request

Date: 2026-09-14. Target: `https://public-site.stage.exclusiveresorts.com/inquire/`.

Native Chrome DevTools was attached before the form interaction. Network recording was enabled, the log was cleared, Fetch/XHR was selected, and the Network filter was `method:POST`.

## Blocking setup

DevTools Request conditions had blocking enabled with this single rule:

```text
*://public-site.stage.exclusiveresorts.com/submit-form/*
```

The rule was narrowed to the submit endpoint before the form was submitted; no global `*://*` rule remained active.

## Result

The form was completed with synthetic values and submitted after the page's client-side validation also required Phone. Network showed:

| Attribute | Observation |
| --- | --- |
| Request URL | `https://public-site.stage.exclusiveresorts.com/submit-form/` |
| Type | `fetch` |
| Status | `(blocked:devtools)` |
| Transfer | `0.0 kB` |
| Response | `No data found for resource with given identifier` |

The Payload tab remained visible for the blocked request and showed the expected form structure. Values are redacted here:

```text
Email <synthetic email>
Phone <synthetic phone>
FirstName <synthetic first name>
LastName <synthetic last name>
ZIP <synthetic postal code>
termsAgreement true
preferredContactType Email
form SHORT_FORM
```

The payload also contained generated tracking/session fields. They were not copied into repository artifacts.

## Scope and limits

This proves the browser attempted the submit fetch and DevTools blocked it before an HTTP response. No submit response or server-side status was received, so this run did not create a server-side lead through this endpoint.

The block targeted only `/submit-form/`. An auxiliary `validate-email` request was allowed to complete, and the separate `fb-events` request still produced a browser CORS error. Those auxiliary requests are outside the submit-endpoint block and are recorded here to avoid implying that every network request was blocked.
