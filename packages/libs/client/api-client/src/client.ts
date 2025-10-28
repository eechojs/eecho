type SimpleInit = Omit<RequestInit, "headers"> & {
  headers?: { [key: string]: string };
};

export interface FetchExceptionContext {
  errorType: "FetchException";
  requestUrl: string;
  response?: Response;
  options: RequestInit;
  timestamp: Date;
}

export type APIExceptionHandler =
  (ctx: FetchExceptionContext) => Promise<{ result?: Response; isNext: boolean }>;

  export type RequestHandler = (p: {url: string, options: SimpleInit}) => Promise<{ url: string; options: SimpleInit }>;

class FetchException extends Error implements FetchExceptionContext {
  errorType: "FetchException" = "FetchException";
  requestUrl: string;
  response?: Response;
  options: RequestInit
  timestamp: Date;
  
  constructor(public ctx: FetchExceptionContext) {
    super(`Fetch error: ${ctx.errorType} at ${ctx.timestamp.toISOString()}`);
    this.requestUrl = ctx.requestUrl;
    this.response = ctx.response;
    this.options = ctx.options;
    this.timestamp = ctx.timestamp;
  }
}

export function createHttpClient() {
  let __host = "";
  let __headers: Record<string, string> = {};
  let __requestHandlers: RequestHandler[] = [];
  let __apiExceptionHandlers: APIExceptionHandler[] = [];

  async function runHandlers(ctx: FetchException) {
    if (__apiExceptionHandlers.length === 0) throw ctx;
    for (const handler of __apiExceptionHandlers) {
      const { result, isNext } = await handler(ctx);
      if (!isNext) return result;
    }
    throw ctx;
  }

  return {
    setHost(url: string) { __host = url; },
    setHeader(header: Record<string, string>) { __headers = header; },
    addRequestHandler(handler: RequestHandler) {
      __requestHandlers.push(handler);
    },
    addExceptionHandler(handler: APIExceptionHandler) {
      __apiExceptionHandlers.push(handler);
    },

    get host() { return __host; },
    get headers() { return __headers; },
    get apiExceptionHandlers() { return __apiExceptionHandlers; },

    async fetch(p: { url: string; options?: SimpleInit }) {
      let { url, options = {} } = p;

      const combinedHeaders: Record<string, string> = {
        ...__headers,
        ...(options.headers ?? {}),
      };

      options = { ...options, headers: combinedHeaders };

      for (const handler of __requestHandlers) {
        const next = await handler({ url, options });
        url = next.url;
        options = next.options;
      }

      const fullUrl = (() => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        
        if (url.startsWith('/')) {
          const hostUrl = new URL(__host);
          return `${hostUrl.origin}${hostUrl.pathname.replace(/\/$/, '')}${url}`;
        }
        
        const normalizedHost = __host.endsWith('/') ? __host.slice(0, -1) : __host;
        const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
        return `${normalizedHost}${normalizedUrl}`;
      })();

      try {
        const res = await fetch(fullUrl, options);
        if (res.ok) return res;

        const ctx = new FetchException({
          errorType: "FetchException",
          requestUrl: fullUrl,
          response: res,
          options,
          timestamp: new Date(),
        });

        return await runHandlers(ctx);
      } catch (err) {
        const netCtx = new FetchException({
          errorType: "FetchException",
          requestUrl: fullUrl,
          options,
          timestamp: new Date(),
        });
        return await runHandlers(netCtx);
      }
    },
  };
}
