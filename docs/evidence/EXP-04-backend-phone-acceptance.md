# EXP-04 — Backend acceptance of a valid phone value

Date: 2026-09-14. Target: `https://public-site.stage.exclusiveresorts.com/inquire/`.

One controlled server-side check used synthetic candidate data. The form was submitted with a syntactically valid synthetic international phone value, Email as the preferred contact method, required email/privacy consent enabled, and SMS opt-in disabled. No candidate-provided contact values were used.

## Network result

| Attribute | Observation |
| --- | --- |
| Request URL | `https://public-site.stage.exclusiveresorts.com/submit-form/` |
| Method | `POST` |
| Type | `fetch` |
| Content-Type | `application/x-www-form-urlencoded` |
| Status | `200 OK` |
| Response Content-Type | `application/json` |
| Response shape | `{ "data": { "id": "<redacted internal id>" } }` |

The Payload tab showed these relevant fields; values are redacted:

```text
Email <synthetic email>
Phone <synthetic international phone>
FirstName <synthetic first name>
LastName <synthetic last name>
ZIP <synthetic postal code>
termsAgreement true
preferredContactType Email
form SHORT_FORM
```

## UI result

The form entered `SENDING...` and then displayed **“We appreciate your interest.”** followed by the optional referral/professional-details step. This confirms that the backend accepted this valid phone value and the complete short-form request. It does not prove CRM delivery, email delivery or downstream lead processing.

The separate `fb-events` request still produced a browser CORS `AllowOriginMismatch` error; this did not prevent the submit endpoint from returning `200 OK`.
