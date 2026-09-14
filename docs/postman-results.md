# Postman/Newman stage record

The Postman collection and environment are prepared in [postman/collection.json](../postman/collection.json) and [postman/environment.json](../postman/environment.json). The browser contract was captured in native Chrome and is transcribed, with sensitive values removed, in [EXP-02](evidence/EXP-02-network-capture.md).

Observed baseline:

- `POST https://public-site.stage.exclusiveresorts.com/submit-form/`
- `Content-Type: application/x-www-form-urlencoded`
- raw body is a JSON wrapper with `values` (URL-encoded short-form fields) and `form: SHORT_FORM`
- `200 OK`, `application/json`, response shape `{ "data": { "id": "<redacted>" } }`

The capture also showed session cookies and generated integration identifiers. They are intentionally absent from the collection and environment. EXP-04 manually verified one happy-path server acceptance with a valid synthetic international phone. EXP-05 manually verified the negative phone case through one direct browser request: `Phone=123` still returned `200 OK`. Other negative server rules, CRM delivery and downstream notifications were not verified.

The collection includes a redacted baseline template plus missing-required-field, malformed-email, missing-consent, international-boundary and unsupported-method variants. `contractCaptured` remains `false` by default, so a normal Newman run is still a safety/blocker check and cannot send a live lead request. Set it to `true` only in a separately approved isolated environment with fresh synthetic data and any required session setup.

The blocked run was verified with `npm run postman:check`: Newman completed with exit code 0, executed 6 collection pre-request guards, sent 0 HTTP requests and recorded 0 failures. This validates the guard, not API behavior.
