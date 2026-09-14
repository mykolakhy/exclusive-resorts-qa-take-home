# EXP-02 — Native Chrome Network capture

Date: 2026-09-13. Target: `https://public-site.stage.exclusiveresorts.com/inquire/`.

One controlled submission used synthetic candidate data after the browser's local form state was cleared. Native Chrome DevTools was attached to the same page before interaction. Network was recording, Preserve log was enabled, the filter was `method:POST`, and only Fetch/XHR requests were selected.

## Captured submit contract

| Attribute | Observation |
| --- | --- |
| Request URL | `https://public-site.stage.exclusiveresorts.com/submit-form/` |
| Method | `POST` |
| Type | `fetch` |
| Content-Type | `application/x-www-form-urlencoded` |
| Response status | `200 OK` |
| Response Content-Type | `application/json` |
| Response shape | `{ "data": { "id": "<redacted internal id>" } }` |
| Browser result | Disabled `SENDING...`, then “We appreciate your interest.” and the optional referral/professional-details step |

The request body is a JSON wrapper sent with the form-urlencoded content type. Its `values` member contains the URL-encoded short-form fields:

```json
{
  "values": "Email=<synthetic-email-encoded>&Phone=<encoded-phone>&FirstName=<encoded-first-name>&LastName=<encoded-last-name>&ZIP=<postal>&termsAgreement=true&FBID=<synthetic-session-id>&GCLID=&msclkid=&C_SFDCLastCampaignID=&C_Page_URL=https%3A%2F%2Fpublic-site.stage.exclusiveresorts.com%2Finquire%2F&smsOptIn=&preferredTime=&preferredDays=&preferredContactType=Email&Braze_Campaign_ID=&Referrer_URL=",
  "form": "SHORT_FORM"
}
```

The browser request also carried session cookies and a generated integration identifier. Cookies, internal identifiers, candidate contact values and other request metadata are intentionally excluded from repository artifacts. The response identifier is recorded only as a redacted shape; it does not prove CRM delivery or downstream notification.

## Related request

The same submit action attempted a Fetch/XHR request to `https://public.awsprod.exclusiveresorts.com/fb-events`, which failed in the browser with a CORS `AllowOriginMismatch` error. The form submit itself still returned `200 OK` and advanced to the success step. This is recorded as an integration observation, not as proof of impact to lead creation.

## Scope boundary

This capture establishes the browser-level method, endpoint, body shape, status and response shape. It does not authorize replaying the request against the live or stage target, validate server-side field rules, or verify CRM/email/SMS delivery. The Postman/Newman collection therefore keeps `contractCaptured=false` by default and sends zero requests until an isolated target is explicitly approved.
