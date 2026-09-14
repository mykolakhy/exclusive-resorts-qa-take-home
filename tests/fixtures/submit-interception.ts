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
  /** Waits for and returns the first captured lead request. */
  waitForLeadRequest: () => Promise<CapturedLeadRequest>;
};

const writeMethods = new Set(['POST', 'PUT', 'PATCH']);

/**
 * Determines whether a write request is likely to submit the inquiry form.
 *
 * The form sends a separate email-validation request, which is intentionally
 * excluded so it cannot be mistaken for a lead submission.
 *
 * @param url Request URL to inspect.
 * @param rawBody Unparsed request body.
 * @param method HTTP method used by the request.
 * @returns `true` when the request looks like a lead submission.
 */
function isLeadLikeRequest(url: string, rawBody: string, method: string): boolean {
  if (!writeMethods.has(method)) return false;
  const pathname = new URL(url).pathname.toLowerCase();
  // The form performs a separate email-validation POST. It is not a lead
  // submission and must not make negative tests look like they sent a lead.
  if (pathname.includes('/validate-email')) return false;

  const signal = `${pathname} ${rawBody}`.toLowerCase();
  return /inquir|lead|contact|form|email|telephone|phone|postal|firstname|lastname|consent|preferred/.test(signal);
}

/**
 * Parses a request body using the formats observed for the inquiry endpoint.
 *
 * @param rawBody Unparsed request body.
 * @returns Parsed JSON, parsed form fields, the original string, or `null`.
 */
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

/**
 * Intercepts write requests made by the inquiry page.
 *
 * Lead-like requests are captured and fulfilled with a deterministic response;
 * unrelated write requests continue to the network. The returned collections
 * are updated as requests are observed.
 *
 * @param page Playwright page whose requests should be intercepted.
 * @returns Captured requests and a helper that waits for the first lead request.
 */
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

/**
 * Checks whether a captured request body contains a value.
 *
 * Both the original body and its parsed representation are searched so the
 * helper works with JSON and URL-encoded payloads.
 *
 * @param request Captured request to inspect.
 * @param value Text to find in the request body.
 * @returns `true` when the value appears in either body representation.
 */
export function bodyContains(request: CapturedLeadRequest, value: string): boolean {
  return request.rawBody.includes(value) || JSON.stringify(request.body).includes(value);
}
