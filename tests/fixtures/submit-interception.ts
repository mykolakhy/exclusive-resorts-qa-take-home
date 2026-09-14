import { expect, Page } from '@playwright/test';

export type CapturedLeadRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  rawBody: string;
  body: Record<string, unknown> | string | null;
};

export type SubmitInterception = {
  leadRequests: CapturedLeadRequest[];
  allWriteRequests: string[];
  waitForLeadRequest: () => Promise<CapturedLeadRequest>;
};

const writeMethods = new Set(['POST', 'PUT', 'PATCH']);

function isLeadLikeRequest(url: string, rawBody: string, method: string): boolean {
  if (!writeMethods.has(method)) return false;
  const signal = `${url} ${rawBody}`.toLowerCase();
  return /inquir|lead|contact|form|email|telephone|phone|postal|firstname|lastname|consent|preferred/.test(signal);
}

function parseBody(rawBody: string): Record<string, unknown> | string | null {
  if (!rawBody) return null;
  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    try {
      return Object.fromEntries(new URLSearchParams(rawBody).entries());
    } catch {
      return rawBody;
    }
  }
}

export async function interceptLeadRequests(page: Page): Promise<SubmitInterception> {
  const leadRequests: CapturedLeadRequest[] = [];
  const allWriteRequests: string[] = [];
  let resolveFirstRequest: (request: CapturedLeadRequest) => void = () => undefined;
  const firstRequest = new Promise<CapturedLeadRequest>((resolve) => {
    resolveFirstRequest = resolve;
  });

  await page.route('**/*', async (route) => {
    const request = route.request();
    const method = request.method();
    if (!writeMethods.has(method)) {
      await route.continue();
      return;
    }

    const url = request.url();
    const rawBody = request.postData() ?? '';
    allWriteRequests.push(`${method} ${url}`);

    if (!isLeadLikeRequest(url, rawBody, method)) {
      await route.continue();
      return;
    }

    const captured: CapturedLeadRequest = {
      method,
      url,
      headers: request.headers(),
      rawBody,
      body: parseBody(rawBody)
    };
    leadRequests.push(captured);
    resolveFirstRequest(captured);

    // Browser EXP-02 captured the live response shape, but this fixture must
    // remain deterministic and must never forward a lead-capable write.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        status: 'success',
        submitted: true,
        message: 'We appreciate your interest.'
      })
    });
  });

  return {
    leadRequests,
    allWriteRequests,
    waitForLeadRequest: async () => {
      try {
        await expect.poll(() => leadRequests.length, { timeout: 5_000 }).toBeGreaterThan(0);
      } catch (error) {
        throw new Error(`${String(error)}\nObserved write requests:\n${allWriteRequests.join('\n') || '(none)'}`);
      }
      return firstRequest;
    }
  };
}

export function bodyContains(request: CapturedLeadRequest, value: string): boolean {
  return request.rawBody.includes(value) || JSON.stringify(request.body).includes(value);
}
