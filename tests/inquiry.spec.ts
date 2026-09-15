import { expect, test } from '@playwright/test';
import { syntheticLead, invalidEmails } from './fixtures/test-data';
import { interceptLeadRequests } from './fixtures/submit-interception';
import { InquiryPage } from './pages/inquiry-page';

test.describe('Exclusive Resorts inquiry form', () => {
  test('@smoke TC-001 form loads with required controls', async ({ page }) => {
    const inquiry = new InquiryPage(page);
    await inquiry.goto();

    await expect(inquiry.firstName).toBeVisible();
    await expect(inquiry.lastName).toBeVisible();
    await expect(inquiry.email).toBeVisible();
    await expect(inquiry.postalCode).toBeVisible();
    await expect(inquiry.phone).toBeVisible();
    await expect(inquiry.emailMethod).toBeVisible();
    await expect(inquiry.requiredConsent).toBeVisible();
    await expect(inquiry.smsOptIn).toBeVisible();
  });

  test('@smoke TC-002 valid inquiry sends one request', async ({ page }) => {
    const interception = await interceptLeadRequests(page);
    const inquiry = new InquiryPage(page);
    await inquiry.goto();
    await inquiry.chooseEmailMethod();
    await inquiry.chooseRequiredConsent();
    await inquiry.fillRequired();
    await inquiry.waitForEmailValidation();

    await expect(inquiry.submit).toBeEnabled();
    await inquiry.submit.click();

    const request = await interception.waitForLeadRequest();
    expect(request.method).toBe('POST');
    expect(new URL(request.url).pathname).toBe('/submit-form/');
    const payload = JSON.parse(request.rawBody);
    expect(payload.form).toBe('SHORT_FORM');
    const fields = Object.fromEntries(new URLSearchParams(payload.values));
    expect(fields).toMatchObject({
      FirstName: syntheticLead.firstName,
      LastName: syntheticLead.lastName,
      Email: syntheticLead.email,
      ZIP: syntheticLead.postalCode,
      termsAgreement: 'true',
      preferredContactType: 'Email'
    });
    expect(fields.Phone.replace(/\D/g, '')).toBe(syntheticLead.phone.replace(/\D/g, ''));
    await expect(page.getByText(/We appreciate your interest/i)).toBeVisible();
    expect(interception.leadRequests).toHaveLength(1);
  });

  test('@regression BUG-03 rapid double activation does not duplicate the request', async ({ page }) => {
    const interception = await interceptLeadRequests(page, 500);
    const inquiry = new InquiryPage(page);
    await inquiry.goto();
    await inquiry.chooseEmailMethod();
    await inquiry.chooseRequiredConsent();
    await inquiry.fillRequired();
    await inquiry.waitForEmailValidation();

    await inquiry.submit.dblclick({ delay: 50 });
    await interception.waitForLeadRequest();
    await expect(page.getByText(/We appreciate your interest/i)).toBeVisible();
    await expect.poll(() => interception.leadRequests.length).toBe(1);
  });

  test('@negative TC-003 empty form shows required errors without a request', async ({ page }) => {
    const interception = await interceptLeadRequests(page);
    const inquiry = new InquiryPage(page);
    await inquiry.goto();
    const submitted = await inquiry.trySubmit();
    if (submitted) {
      await expect(page.getByText(/There was a problem with your submission/i)).toBeVisible();
      for (const field of [inquiry.firstName, inquiry.lastName, inquiry.email, inquiry.postalCode]) {
        await expect(page.locator('.formkit-outer').filter({ has: field })
          .getByText('This field is required.', { exact: true })).toBeVisible();
      }
    } else {
      await expect(inquiry.submit).toBeDisabled();
    }
    await interception.expectNoLeadRequests();
  });

  test('@negative TC-005 missing required consent blocks submission', async ({ page }) => {
    const interception = await interceptLeadRequests(page);
    const inquiry = new InquiryPage(page);
    await inquiry.goto();
    await inquiry.chooseEmailMethod();
    await inquiry.fillRequired();
    await inquiry.waitForEmailValidation();
    await expect(inquiry.requiredConsent).not.toBeChecked();
    const submitted = await inquiry.trySubmit();
    if (submitted) {
      await expect(page.getByText(/There was a problem with your submission/i)).toBeVisible();
    } else {
      await expect(inquiry.submit).toBeDisabled();
    }
    await interception.expectNoLeadRequests();
  });

  for (const invalidEmail of invalidEmails) {
    test(`@negative TC-009 rejects malformed email: ${invalidEmail}`, async ({ page }) => {
      const interception = await interceptLeadRequests(page);
      const inquiry = new InquiryPage(page);
      await inquiry.goto();
      await inquiry.chooseEmailMethod();
      await inquiry.chooseRequiredConsent();
      await inquiry.fillRequired({ email: invalidEmail });
      await inquiry.email.blur();
      await inquiry.trySubmit();
      await expect(page.getByText('Please enter a valid email address.', { exact: true })).toBeVisible();
      expect(await inquiry.email.evaluate((element) => (element as HTMLInputElement).validity.valid)).toBe(false);
      await interception.expectNoLeadRequests();
    });
  }

  test('@negative TC-011 phone strips alphabetic input without a request', async ({ page }) => {
    const interception = await interceptLeadRequests(page);
    const inquiry = new InquiryPage(page);
    await inquiry.goto();
    await inquiry.phone.click();
    await inquiry.phone.pressSequentially('abcd');
    await inquiry.phone.press('Tab');

    await expect(inquiry.phone).toHaveValue('');
    await interception.expectNoLeadRequests();
  });

  test('@negative BUG-04 TC-011 incomplete phone blocks submission', async ({ page }) => {
    const interception = await interceptLeadRequests(page);
    const inquiry = new InquiryPage(page);
    await inquiry.goto();
    await inquiry.chooseEmailAndConsent();
    await inquiry.fillRequired({ phone: '123' });
    await inquiry.waitForEmailValidation();
    await expect(inquiry.phone).toHaveValue('123');
    await expect(page.getByText('Please enter a valid phone number', { exact: true })).toBeVisible();
    await inquiry.submit.click();
    // Only the final rejection assertion is expected to fail: setup and the
    // visible validation error above must succeed normally.
    test.fail(true, 'BUG-04: Submit emits Phone=123 despite the visible phone validation error');
    await interception.expectNoLeadRequests();
  });

  test('@regression TC-014 name accepts 50 characters and rejects 51', async ({ page }) => {
    const interception = await interceptLeadRequests(page);
    const inquiry = new InquiryPage(page);
    await inquiry.goto();
    await inquiry.chooseEmailAndConsent();
    await inquiry.fillRequired({ firstName: 'Q'.repeat(50) });
    await inquiry.waitForEmailValidation();
    const nameField = page.locator('.formkit-outer').filter({ has: inquiry.firstName });
    await expect(nameField).toHaveAttribute('data-complete', 'true');
    await expect(inquiry.firstName).toHaveValue('Q'.repeat(50));

    await inquiry.firstName.fill('Q'.repeat(51));
    await inquiry.firstName.blur();
    await expect(nameField).not.toHaveAttribute('data-complete', 'true');
    await inquiry.submit.click();
    await expect(page.getByText('Name* must be less than or equal to 50 characters.', { exact: true })).toBeVisible();
    await interception.expectNoLeadRequests();
  });
});
