import { expect, test } from '@playwright/test';
import { interceptLeadRequests } from './fixtures/submit-interception';

test.describe('Submit interception checks (no live site)', () => {
  test('negative assertion catches a delayed submit', async ({ page }) => {
    const interception = await interceptLeadRequests(page);
    await page.evaluate(() => {
      setTimeout(() => {
        void fetch('https://fixture.invalid/submit-form/', {
          method: 'POST', body: JSON.stringify({ form: 'SHORT_FORM', values: 'Phone=123' })
        }).catch(() => undefined);
      }, 100);
    });
    await expect(interception.expectNoLeadRequests()).rejects.toThrow('No /submit-form/ request');
    expect(interception.leadRequests).toHaveLength(1);
  });

  test('email validation and lead-like analytics are not counted as submits', async ({ page }) => {
    const interception = await interceptLeadRequests(page);
    await page.evaluate(async () => {
      await fetch('https://fixture.invalid/validate-email/', {
        method: 'POST', body: JSON.stringify({ email: 'qa@example.invalid' })
      }).catch(() => undefined);
      await fetch('https://fixture.invalid/analytics', {
        method: 'POST', body: JSON.stringify({ event: 'form_submit', email: 'qa@example.invalid' })
      }).catch(() => undefined);
    });
    await interception.expectNoLeadRequests();
    expect(interception.allWriteRequests).toHaveLength(2);
  });
});
