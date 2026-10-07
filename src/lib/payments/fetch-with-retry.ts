// Fetch with retry + timeout helper — Item 23
// Use for payment gateway calls (SSLCommerz etc.)

export interface RetryOptions {
  retries?: number;       // default 3
  baseDelayMs?: number;   // default 500
  timeoutMs?: number;     // default 15000
  shouldRetry?: (err: unknown, attempt: number) => boolean;
}

export class FetchTimeoutError extends Error {
  constructor(public ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = 'FetchTimeoutError';
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: RetryOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? 3;
  const baseDelay = opts.baseDelayMs ?? 500;
  const timeoutMs = opts.timeoutMs ?? 15000;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      // Retry on 5xx + 429 (rate limit)
      if (res.status >= 500 || res.status === 429) {
        if (attempt < retries) {
          await sleep(baseDelay * Math.pow(2, attempt - 1));
          continue;
        }
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (err instanceof Error && err.name === 'AbortError') {
        lastErr = new FetchTimeoutError(timeoutMs);
      }
      if (opts.shouldRetry && !opts.shouldRetry(err, attempt)) break;
      if (attempt < retries) {
        await sleep(baseDelay * Math.pow(2, attempt - 1));
        continue;
      }
      throw lastErr;
    }
  }
  throw lastErr;
}
