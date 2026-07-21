type RequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export interface FetchExceptionContext {
  errorType: 'FetchException';
  requestUrl: string;
  response?: Response;
  options: RequestInit;
  timestamp: Date;
  cause?: unknown;
}

export type APIExceptionHandler = (
  context: FetchExceptionContext,
) => Promise<{ result?: Response; isNext: boolean }>;

export type RequestHandler = (request: {
  url: string;
  options: RequestOptions;
}) => Promise<{ url: string; options: RequestOptions }>;

class FetchException extends Error implements FetchExceptionContext {
  readonly name = 'FetchException';
  readonly errorType = 'FetchException';
  readonly requestUrl: string;
  readonly response?: Response;
  readonly options: RequestInit;
  readonly timestamp: Date;
  readonly cause?: unknown;

  constructor(context: FetchExceptionContext) {
    const status = context.response ? ` (${context.response.status})` : '';
    super(`Fetch failed for ${context.requestUrl}${status}`);

    this.requestUrl = context.requestUrl;
    this.response = context.response;
    this.options = context.options;
    this.timestamp = context.timestamp;
    this.cause = context.cause;
  }
}

function resolveRequestUrl(host: string, url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (!host) {
    throw new Error(`Cannot resolve relative request URL without a host: ${url}`);
  }

  const normalizedHost = host.replace(/\/$/, '');
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${normalizedHost}${normalizedPath}`;
}

async function runExceptionHandlers(
  exception: FetchException,
  handlers: readonly APIExceptionHandler[],
) {
  for (const handler of handlers) {
    const { result, isNext } = await handler(exception);

    if (!isNext) {
      if (result) {
        return result;
      }

      throw exception;
    }
  }

  throw exception;
}

export function createHttpClient() {
  let host = '';
  let headers: Record<string, string> = {};
  const requestHandlers: RequestHandler[] = [];
  const exceptionHandlers: APIExceptionHandler[] = [];

  return {
    setHost(url: string) {
      host = url;
    },
    setHeader(nextHeaders: Record<string, string>) {
      headers = { ...nextHeaders };
    },
    addRequestHandler(handler: RequestHandler) {
      requestHandlers.push(handler);
    },
    addExceptionHandler(handler: APIExceptionHandler) {
      exceptionHandlers.push(handler);
    },

    get host() {
      return host;
    },
    get headers() {
      return { ...headers };
    },
    get apiExceptionHandlers() {
      return [...exceptionHandlers];
    },

    async fetch(input: { url: string; options?: RequestOptions }) {
      let request: { url: string; options: RequestOptions } = {
        url: input.url,
        options: {
          ...input.options,
          headers: {
            ...headers,
            ...input.options?.headers,
          },
        },
      };

      for (const handler of requestHandlers) {
        request = await handler(request);
      }

      const requestUrl = resolveRequestUrl(host, request.url);
      let response: Response;

      try {
        response = await fetch(requestUrl, request.options);
      } catch (cause) {
        return runExceptionHandlers(
          new FetchException({
            errorType: 'FetchException',
            requestUrl,
            options: request.options,
            timestamp: new Date(),
            cause,
          }),
          exceptionHandlers,
        );
      }

      if (response.ok) {
        return response;
      }

      return runExceptionHandlers(
        new FetchException({
          errorType: 'FetchException',
          requestUrl,
          response,
          options: request.options,
          timestamp: new Date(),
        }),
        exceptionHandlers,
      );
    },
  };
}
