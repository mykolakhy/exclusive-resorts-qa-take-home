# Test data

Status: synthetic data was used for client-side exploration, the EXP-02 Network capture, the EXP-04 backend-acceptance check and the EXP-05 negative phone-validation check; candidate-controlled LIVE-01 data was submitted once as the controlled baseline. The site displayed its visible success step; CRM delivery was not verified. See the notebook for validation attempts and limitations.

## Synthetic baseline for intercepted submissions

These values are for tests in which lead-creation requests are intercepted. They are not verified real contact details and must not be used for live delivery.

| Field | Value | Notes |
| --- | --- | --- |
| Name | QA Candidate - Automation | Clearly identifies the purpose. |
| Email | qa.candidate+automation@example.com | Synthetic address; not a candidate-controlled inbox. |
| Postal Code | 10001 | Baseline US-format input; not a claim about candidate location. |
| Phone | 510000000 | Synthetic Polish national-format input for the browser's default country context; application acceptance is unverified. |
| Preferred Contact Method | Email | Other choices will be explored independently. |
| Preferred Time / Days | Unset | Conditional in the observed UI: available for Phone, absent for Text/Email. |
| Privacy/Email Consent | Selected only within the isolated test scenario | Do not infer consent for real marketing communications. |
| SMS Opt-in | Unselected | Optional according to the PDF. |

## Live baseline preparation

Candidate-provided values were supplied privately during EXP-01. The following template documents their purpose without publishing the actual contacts:

- Name: QA Candidate - <candidate name>.
- Email: a candidate-controlled test alias.
- Phone: a candidate-controlled test number.
- Postal code: an agreed test value; no private home address is needed.

Do not obtain these values from unrelated account settings or Git identity. Do not commit actual contact details. Record a redacted data-set identifier in the submission ledger and leave SMS opt-in unselected unless the scenario specifically requires otherwise.

## Data categories to investigate

- Empty values and whitespace-only input.
- Email syntax variations.
- Phone typing versus pasting, alphabetic input and international prefix handling.
- US and international postal-code formats.
- Long text, Unicode and emoji in free-text input.

This is a data preparation inventory, not a finalized test-case list. Define exact boundaries and expected outcomes after observing the form and resolving requirement questions. Security payloads require a controlled execution path that prevents unintended persistence in CRM.
