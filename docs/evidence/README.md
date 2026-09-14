# Evidence

Exploratory evidence is recorded in [EXP-01 UI observations](EXP-01-ui-observations.md), the redacted [EXP-02 native Chrome Network capture](EXP-02-network-capture.md), the [EXP-03 blocked submit capture](EXP-03-blocked-network-capture.md), the [EXP-04 valid-phone acceptance capture](EXP-04-backend-phone-acceptance.md), and the [EXP-05 invalid-phone acceptance capture](EXP-05-backend-invalid-phone-acceptance.md). The records contain reviewed excerpts and clear limits on what was captured. Initial availability observations remain in [preparation.md](../preparation.md).

- Store reviewed screenshots and redacted request/response excerpts here.
- Use names such as EXP-01-OBS-01-description.png or BUG-01-response-redacted.json.
- Link each artifact from an observation or bug report, with its date, environment and action context.
- Keep unreviewed captures under raw/ (ignored by Git). HAR files are also ignored by default.
- Before publishing, inspect artifacts for cookies, authorization/CSRF tokens, personal contact details and unrelated browser content.
- Remove sensitive values while preserving the structural evidence needed to understand the finding. Redaction must not change the reported behavior.
- Screenshots prove visible UI state, not backend processing or CRM delivery. Label request evidence and mocked responses accurately.
