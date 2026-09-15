import { expect, Page } from '@playwright/test';

export type CapturedLeadRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  rawBody: string;
  body: unknown;
};

export type SubmitInterception = {
  leadRequests: CapturedLeadRequest[];
  allWriteRequests: string[];
  /** Waits for and returns the first captured lead request. */
  waitForLeadRequest: () => Promise<CapturedLeadRequest>;
  /** Observes a full quiet window; fails immediately if a submit request appears. */
  expectNoLeadRequests: () => Promise<void>;
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
 * @returns Parsed JSON, decoded form fields, or `null` for an empty body.
 */
function parseBody(rawBody: string): unknown {
  if (!rawBody) return null;
  try {
    return JSON.parse(rawBody);
  } catch {
    return Object.fromEntries(new URLSearchParams(rawBody).entries());
  }
}

/**
 * Intercepts write requests made by the inquiry page.
 *
 * Submit-endpoint requests are captured and fulfilled with a deterministic response;
 * email validation is stubbed, and other lead-like writes are blocked.
 * Unrelated write requests continue to the network. The returned collections
 * are updated as requests are observed.
 *
 * @param page Playwright page whose requests should be intercepted.
 * @param responseDelayMs Simulated submit latency for checking repeated activation while pending.
 * @returns Captured requests and a helper that waits for the first lead request.
 */
export async function interceptLeadRequests(page: Page, responseDelayMs = 0): Promise<SubmitInterception> {
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

    // Isolate the asynchronous email service; native email validation remains
    // active in the browser. This response shape is consumed by the live client.
    if (new URL(url).pathname === '/validate-email/') {
      await route.fulfill({ status: 200, json: { valid: true } });
      return;
    }

    if (new URL(url).pathname !== '/submit-form/') {
      // Keep the broad heuristic as a safety guard, not as a submit counter.
      if (isLeadLikeRequest(url, rawBody, method)) {
        await route.abort('blockedbyclient');
        return;
      }
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

    if (responseDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, responseDelayMs));
    }

    // Browser EXP-02 captured the live response shape, but this fixture must
    // remain deterministic and must never forward a lead-capable write.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { id: 'qa-intercepted-lead' } })
    });
  });

  return {
    leadRequests,
    allWriteRequests,
    expectNoLeadRequests: async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        // A zero-count poll succeeds instantly. Observe delayed validation and
        // submission for one full second instead; this is a bounded assertion.
        await Promise.race([
          firstRequest,
          new Promise<void>((resolve) => { timer = setTimeout(resolve, 1_000); })
        ]);
        expect(leadRequests.length, 'No /submit-form/ request during the observation window').toBe(0);
      } finally {
        clearTimeout(timer);
      }
    },
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
