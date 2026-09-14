# EXP-01: UI observation excerpts

Dates: 2026-09-13 and 2026-09-14. Sources: direct browser interaction, accessibility/DOM inspection and screenshots reviewed during the session. These are transcribed excerpts, not a saved HAR or screenshot collection. No real contact details are included.

## Empty form

After pressing Submit with empty fields:

```text
There was a problem with your submission. Please review the fields below.
First name: This field is required.
Last name: This field is required.
Email: This field is required.
Postal Code: This field is required.
Phone: This field is required
Preferred Contact Method: Please select your preferred contact method
```

Consent was unselected and visually highlighted red; no specific textual consent error appeared in the observed accessibility tree. The original in-app check did not capture the request log; a repeat in native Chrome with Fetch/XHR recording showed no `/submit-form/` request.

## Conditional contact preferences

- Phone: Time of Day and Days displayed.
- Text: Time of Day and Days not displayed; SMS opt-in remained unselected.
- Email: Time of Day and Days hidden.
- Only the chosen contact-method radio remained selected.
- Time options: Morning, Afternoon, Evening, I'm Flexible.
- Day options: Monday-Friday, Saturday-Sunday, I'm Flexible.

Extract from the inspected Time of Day control; framework-generated attributes omitted:

```html
<label for="preferredTime">Preferred Time of Day</label>
<div class="custom-select" tabindex="0">
  <div class="selected open placeholder">Select</div>
  <div class="items">
    <div value="Morning">Morning</div>
    <div value="Afternoon">Afternoon</div>
    <div value="Evening">Evening</div>
    <div value="I'm Flexible">I'm Flexible</div>
  </div>
</div>
```

Days used the same structure, with label for="preferredDays". Neither inspected custom-select had a corresponding id, combobox/listbox role or labelled-by association. While the open dropdown had focus, ArrowDown followed by Enter left Select unchanged for both controls. Clicking Morning or Monday-Friday selected the corresponding option. Escape did not close the observed open Time dropdown.

Independently reproduced in native Chrome at 375 × 812: a physical click focused the Phone radio, then Tab focused the Time control (accessibility focus: container Select). Enter did not open it; ArrowDown scrolled the page rather than selecting an option. Space also did not open it. Tab moved to Days; Enter and ArrowDown again left Select unchanged. This reproduction excludes earlier adapter actions that failed to transfer keyboard focus from DevTools to the page.

## Phone and last-name semantics

Inspected phone input:

```html
<input id="" type="tel" name="telephone" maxlength="25"
       placeholder="Enter a phone number" aria-describedby="">
```

The input had no associated labels, aria-label or aria-labelledby. After its visible validation error, aria-describedby remained empty and aria-invalid was absent. The visible Phone label and validation message were therefore not programmatically connected to the input in this inspection.

The form DOM exposes the exact field names `FirstName` and `LastName`. The Last input used `id="input_1"` and `placeholder="Last"`, with no associated label, aria-label or aria-labelledby in the saved snippet. The visible Name label was associated with the First input only. Placeholder-derived naming must not be described as a complete absence of an accessible name.

## Validation and boundary observations

| Input / action | Observed UI result |
| --- | --- |
| Paste abcd into an empty phone input | Letters did not remain; required error remained. Confirmed visually after native clear/paste. |
| Paste +48123abc into an empty phone input | Mixed string did not remain; required error remained. |
| Phone 123 | Please enter a valid phone number |
| Synthetic +12025550123 | Formatted as +1 202 555 0123, without the phone error after blur. Not submitted. |
| Email foo.com | Please enter a valid email address. |
| Email foo@foo@ | Please enter a valid email address. This was the actual visible value after a duplicate entry during tool troubleshooting. |
| Synthetic example.com email on attempted submit | Email is not valid. Exact rule/source not established; do not use this as an isolated consent check. |
| First name containing only spaces | This field is required. |
| First name Олена 🧪 | No name validation error after blur. |
| First name of 50 Q characters | No length error after blur. |
| First name of 51 or 1000 Q characters | Name* must be less than or equal to 50 characters. |
| First name <img src=x onerror=alert(1)> | Literal input displayed; Name* is not an allowed value. No alert appeared. No submission performed. |
| Postal Code !@# | Postal Code* is not an allowed value. |
| Postal Code 10001, SW1A 1AA, 00-001, K1A 0B1 | No postal validation error after blur. Backend acceptance not established. |

The XSS observation covers only this client input path. It does not establish backend sanitization, reflected output behavior or stored-XSS safety in CRM.

## Console

Observed both in the in-app browser and native Chrome:

```text
Hydration completed but contains mismatches.
[nuxt] Error preloading payload for https://public-site.stage.exclusiveresorts.com/inquire/
```

Chrome also logged unused preloaded-resource warnings. No causal connection between these messages and a particular user-facing defect has been established.

## Native Chrome: missing consent

A candidate-provided, otherwise populated baseline was prepared with Email contact method and both consent checkboxes unselected. After Submit:

- The form remained on /inquire/ and showed the general submission-validation message.
- The required consent checkbox and its text were red, with no specific textual error beside the checkbox.
- The Fetch/XHR view showed only page-content preloads; no lead-creation request was observed in that view.
- A synthetic repeat with Network recording active also showed no `/submit-form/` request when the required consent remained unchecked.
- This is a client-side observation, not proof of server-side consent enforcement.

## Controlled LIVE-01 submission

One controlled submission was executed after explicit confirmation from the candidate. The form used the candidate-provided contact details, Email as the preferred contact method, postal value `00-001`, required email/privacy consent selected, and SMS opt-in left unselected. Actual contact values are redacted from this repository.

Observed sequence:

1. The form entered a disabled `SENDING...` state.
2. After the request completed, the page displayed **“We appreciate your interest. A Membership Director will connect with you shortly.”**
3. The page presented a follow-up form for an optional referral and professional details, with a **SKIP FOR NOW** link. That form was not completed.

This verifies the visible success flow for the candidate-controlled baseline. The in-app browser did not expose the request endpoint, payload, response body or CRM delivery for that run. A later separate synthetic submission captured the browser-level contract in [EXP-02](EXP-02-network-capture.md); it did not use candidate contacts.

## Stage 4 intercepted double-activation check

The Playwright suite used synthetic data and installed interception before interacting with the form. A rapid double activation of Submit produced two lead-capable requests in the isolated interception layer. This confirms a client-side duplicate-request risk without sending a second real lead. BUG-03 records the finding; whether the backend deduplicates the requests remains unverified.

## Mobile inspection

The in-app browser viewport was explicitly set to 375 × 812. Fields stacked vertically and fit within the visible width. Desktop-style navigation text was visibly clipped horizontally. This did **not** reproduce in native Chrome responsive emulation at 375 × 812: the header displayed its mobile navigation button, fields fit the viewport, and conditional dropdowns and consent content remained reachable by scrolling. Do not report the in-app-only clipping as a confirmed website defect.

A native Chrome full-page screenshot was captured as public-site.stage.exclusiveresorts.com_inquire_.png. Chrome reported the download complete (627 KB), but local access to Downloads was denied, including after an approved elevated read. The image has not been imported into the repository; the report must not link to a nonexistent evidence file.

## Tool limitations affecting interpretation

- Read-only DOM inspection did not reliably expose live values of the custom email/phone inputs. Values and validation were checked through native input actions and screenshots instead.
- Some semantic radio clicks did not change state through the browser adapter; native accessibility clicks did. Adapter failures are not product findings.
- The in-app browser did not support content.export or network interception. Native Chrome DevTools is being used for request inspection.
