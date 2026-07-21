import type { APIExceptionHandler, FetchExceptionContext } from './client.js';

const wait = (delayMs: number) => new Promise((resolve) => setTimeout(resolve, delayMs));

function isRetryable(response?: Response) {
  if (!response) {
    return true;
  }

  return response.status === 429 || response.status >= 500;
}

export function createRetryHandler(options: {
  timeout?: number;
  retryCount: number;
}): APIExceptionHandler {
  const { retryCount, timeout: delayMs = 1_000 } = options;

  if (!Number.isInteger(retryCount) || retryCount < 0) {
    throw new RangeError('retryCount must be a non-negative integer.');
  }

  if (delayMs < 0) {
    throw new RangeError('timeout must be non-negative.');
  }

  return async (context: FetchExceptionContext) => {
    if (!isRetryable(context.response) || context.options.signal?.aborted) {
      return { isNext: true };
    }

    let latestResponse: Response | undefined;

    for (let attempt = 0; attempt < retryCount; attempt += 1) {
      await wait(delayMs);

      if (context.options.signal?.aborted) {
        return { isNext: true };
      }

      try {
        latestResponse = await fetch(context.requestUrl, context.options);

        if (latestResponse.ok || !isRetryable(latestResponse)) {
          return { result: latestResponse, isNext: false };
        }
      } catch {
        latestResponse = undefined;
      }
    }

    return latestResponse
      ? { result: latestResponse, isNext: false }
      : { isNext: true };
  };
}
