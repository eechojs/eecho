import { APIExceptionHandler, FetchExceptionContext } from "./client";

export function createRetryHandler(p: { timeout?: number; retryCount: number }): APIExceptionHandler {
  return async (ctx: FetchExceptionContext) => {
    const status = ctx.response?.status;
    const shouldRetry =
      ctx.response == null ||
      status === 429 ||
      (status != null && status >= 500 && status <= 599);

    if (!shouldRetry) {
      return { isNext: true };
    }

    const retryUrl = ctx.requestUrl;
    if (!retryUrl) {
      return { isNext: true };
    }

    const delayMs = p.timeout ?? 1000;

    for (let attempt = 1; attempt <= p.retryCount; attempt++) {
      await new Promise((r) => setTimeout(r, delayMs));

      const signal =
        (ctx.options.signal as AbortSignal | undefined)?.aborted
          ? undefined
          : ctx.options.signal;

      try {
        const retryRes = await fetch(retryUrl, { ...ctx.options, signal });

        if (retryRes.ok) {
          return { result: retryRes, isNext: false };
        }
      } catch (err) {
      }
    }

    return { isNext: false };
  };
}
