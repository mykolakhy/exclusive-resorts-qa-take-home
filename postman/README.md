# Postman/Newman checks

The collection follows the redacted browser submit contract in [EXP-02](../docs/evidence/EXP-02-network-capture.md). It includes seven scenarios: valid lead, missing email, malformed email, incomplete phone (BUG-04), absent required consent, international values and unsupported method.

## Run locally without contacting the company

```text
npm run postman:check
npm run postman:test
```

- `postman:check` runs the default disabled collection: seven pre-request guards, zero HTTP requests, zero response assertions. A successful exit proves only that the requests were skipped.
- `postman:test` starts a temporary server on `127.0.0.1` and runs Newman with local overrides. It verifies actual request encoding, all seven variants and fourteen response assertions. It also checks that misconfiguration sends zero requests and that deliberately broken responses fail the assertions. The server shuts down after the run. CI runs this local check.

The local server's 422/405 error statuses are test fixtures, not observed company API contracts. These checks validate the collection itself, not live API behavior or CRM delivery.

## Use an approved isolated target

1. Set `baseUrl` and `isolatedTargetOrigin` to the exact same isolated origin, for example `https://qa-api.example.test` (without a trailing slash). `submitUrl` defaults to `{{baseUrl}}/submit-form/`.
2. Keep the captured shared stage URL blocked. The guard explicitly rejects that target.
3. Configure `expectedValidationStatuses` and `expectedMethodStatuses` from the isolated API contract before running negative requests. They remain blank by default. Negative expectations must be 4xx; accepting invalid data with 200 is a failure, including BUG-04.
4. Supply any required session setup separately and keep contact data synthetic. Set `contractCaptured=true` only in that local override. This legacy variable is the execution switch; it does not itself establish that the target is isolated.
5. Import both JSON files into Postman and select the environment, or run Newman with the override file. Do not commit session cookies, real contact data or tokens.

The guard resolves nested payload variables before transport and fails the run if enabled requests lack a valid target, payload or expected statuses. Success assertions require the configured 2xx status, JSON content and a non-empty `data.id`. Negative assertions require the configured 4xx and reject a JSON response containing `data.id`. The exact negative error-body contract remains unverified.
