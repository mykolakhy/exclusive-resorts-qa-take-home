import { expect, Locator, Page } from '@playwright/test';
import { LeadData, syntheticLead } from '../fixtures/test-data';

export class InquiryPage {
  readonly page: Page;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly email: Locator;
  readonly postalCode: Locator;
  readonly phone: Locator;
  readonly emailMethod: Locator;
  readonly requiredConsent: Locator;
  readonly smsOptIn: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstName = page.getByPlaceholder('First', { exact: true });
    this.lastName = page.getByPlaceholder('Last', { exact: true });
    this.email = page.getByPlaceholder('name@example.com', { exact: true });
    this.postalCode = page.getByPlaceholder('Postal Code', { exact: true });
    this.phone = page.locator('input[type="tel"]');
    this.emailMethod = page.getByRole('radio', { name: /^Email$/i });
    this.requiredConsent = page.getByRole('checkbox', {
      name: /I expressly consent to receive emails from Exclusive Resorts/i
    });
    this.smsOptIn = page.getByRole('checkbox', { name: /STAY IN THE KNOW/i });
    this.submit = page.getByRole('button', { name: /^Submit$/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/inquire/');
    // Server-rendered inputs appear before Nuxt attaches their event handlers.
    // Wait for hydration before typing so the form model receives the input.
    await this.page.waitForFunction(() => {
      const root = document.querySelector('#__nuxt') as HTMLElement & {
        __vue_app__?: { config: { globalProperties: { $nuxt?: { isHydrating: boolean } } } };
      };
      return root?.__vue_app__?.config.globalProperties.$nuxt?.isHydrating === false;
    });
    await expect(this.firstName).toBeVisible();
    await expect(this.submit).toBeVisible();
  }

  async fillRequired(overrides: Partial<LeadData> = {}): Promise<void> {
    const data = { ...syntheticLead, ...overrides };
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.email.fill(data.email);
    await this.postalCode.fill(data.postalCode);
    await this.phone.fill(data.phone);
    await this.phone.press('Tab');
    await expect(this.phone).toHaveValue(/\d/);
  }

  async chooseEmailMethod(): Promise<void> {
    // The native radio is visually hidden; trigger its native click so the
    // component's Vue model receives the click/input/change sequence.
    await this.emailMethod.evaluate((element) => (element as HTMLInputElement).click());
    await expect(this.emailMethod).toBeChecked();
  }

  /** Waits until FormKit has committed the email and finished its async validation. */
  async waitForEmailValidation(): Promise<void> {
    await expect(this.page.locator('#pardot-short-form .formkit-outer[data-type="email"]'))
      .toHaveAttribute('data-complete', 'true');
  }

  async chooseEmailAndConsent(): Promise<void> {
    await this.chooseEmailMethod();
    await this.chooseRequiredConsent();
  }

  async chooseRequiredConsent(): Promise<void> {
    // This custom checkbox also places the native input outside the viewport.
    await this.requiredConsent.evaluate((element) => (element as HTMLInputElement).click());
    await expect(this.requiredConsent).toBeChecked();
  }

  async trySubmit(): Promise<boolean> {
    await expect(this.submit).toBeVisible();
    if (!(await this.submit.isEnabled())) return false;
    await this.submit.click();
    return true;
  }
}
