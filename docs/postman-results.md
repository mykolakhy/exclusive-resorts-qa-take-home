# Postman/Newman stage record

The Postman collection and environment are prepared in [postman/collection.json](../postman/collection.json) and [postman/environment.json](../postman/environment.json). The browser contract was captured in native Chrome and is transcribed, with sensitive values removed, in [EXP-02](evidence/EXP-02-network-capture.md).

Observed baseline:

- `POST https://public-site.stage.exclusiveresorts.com/submit-form/`
- `Content-Type: application/x-www-form-urlencoded`
- raw body is a JSON wrapper with `values` (URL-encoded short-form fields) and `form: SHORT_FORM`
- `200 OK`, `application/json`, response shape `{ "data": { "id": "<redacted>" } }`

The capture also showed session cookies and generated integration identifiers. They are intentionally absent from the collection and environment. EXP-04 manually verified one happy-path server acceptance with a valid synthetic international phone. EXP-05 manually verified the negative phone case through one direct browser request: `Phone=123` still returned `200 OK`. Other negative server rules, CRM delivery and downstream notifications were not verified.

The collection includes seven variants, adding the incomplete-phone regression for BUG-04. The default `npm run postman:check` executes seven guards, sends zero HTTP requests and performs zero response assertions. This verifies only the disabled state.

## Collection verification — 2026-09-15

`npm run postman:test` starts a loopback stub and runs Newman with local overrides:

- Seven requests reach the stub with the expected method, content type, JSON wrapper and decoded field values; fourteen response assertions pass.
- Disabled execution, an unapproved origin, missing negative status expectations, 200 configured as a rejection, and unresolved payload variables all send zero requests. Invalid enabled configurations fail the run.
- Deliberate invalid-input acceptance, empty success IDs, error responses containing lead IDs, and HTTP 500 responses fail the relevant assertions.

The stub uses 422/405 as fixture statuses only. Negative company API statuses and error schemas remain unverified. Shared stage is blocked by the guard, and no Newman request was sent to the company during this review. See [run instructions](../postman/README.md).
