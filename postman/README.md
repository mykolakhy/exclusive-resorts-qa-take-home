# Postman/Newman checks

The browser-level submit contract is captured and redacted in [EXP-02](../docs/evidence/EXP-02-network-capture.md). The environment contains the observed endpoint, method, content type, body shape and `200` success status, but it still defaults to `contractCaptured=false`. The collection therefore skips every request before transport unless an isolated target is explicitly approved.

To activate the collection safely:

1. Confirm that the target is an isolated test environment with no production CRM side effects.
2. Set `contractCaptured=true` only in a local override or approved environment; do not commit session cookies or generated identifiers.
3. Replace the synthetic placeholder values with controlled test data and provide any required session setup separately.
4. Run the baseline once, then run the negative and boundary variants only against that isolated target.

Commands:

```text
npm run postman:check
```

The current default run is a safety check of the blocked state, not API validation. No Postman/Newman request was sent to the captured endpoint from this repository.
