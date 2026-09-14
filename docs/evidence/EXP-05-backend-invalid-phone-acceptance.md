# EXP-05 — Backend accepted a client-invalid phone

Date: 2026-09-14. Target: `https://public-site.stage.exclusiveresorts.com/inquire/`.

The UI displayed **“Please enter a valid phone number”** for the numeric value `123`, but the Submit control remained available. To isolate server-side behavior without using the UI's client-side gate, one direct browser `fetch` request was sent from DevTools Console with synthetic values only. Request blocking was disabled for this single check and re-enabled immediately afterward.

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

Relevant payload fields were visible in the Network Payload tab:

```text
Email <synthetic email>
Phone 123
FirstName <synthetic first name>
LastName <synthetic last name>
ZIP <synthetic postal code>
termsAgreement true
preferredContactType Email
form SHORT_FORM
```

## Finding

The client rejects `Phone=123`, while the submit endpoint returns `200 OK` and an internal-id response shape for the same malformed value. This demonstrates insufficient server-side phone validation on this request path and is recorded as **BUG-04**. The result does not prove CRM persistence, deduplication or downstream processing; no real contact values were used.
