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
  readonly timestamp = new Date();
  readonly cause?: unknown;

  constructor(failure: {
    requestUrl: string;
    options: RequestInit;
    response?: Response;
    cause?: unknown;
  }) {
    const status = failure.response ? ` (${failure.response.status})` : '';
    super(`Fetch failed for ${failure.requestUrl}${status}`);

    this.requestUrl = failure.requestUrl;
    this.options = failure.options;
    this.response = failure.response;
    this.cause = failure.cause;
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

      break;
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
      let request: Parameters<RequestHandler>[0] = {
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
      let response: Response | undefined;
      let cause: unknown;

      try {
        response = await fetch(requestUrl, request.options);
      } catch (error) {
        cause = error;
      }

      if (response?.ok) {
        return response;
      }

      return runExceptionHandlers(
        new FetchException({ requestUrl, options: request.options, response, cause }),
        exceptionHandlers,
      );
    },
  };
}
