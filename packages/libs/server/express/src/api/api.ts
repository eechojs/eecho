import type { Request as ExpressRequest, RequestHandler, Router } from 'express';

import type { ServerAPISpecification } from '@eecho/definition';

import type { APIHandler, ExpressMiddleware, ExtractBodyParams, ExtractQueryParams } from './api.type.js';

function parseRequestParams<TSpec extends ServerAPISpecification>(
  request: ExpressRequest,
  requestSpec: TSpec['Request'],
) {
  const { queryParams, body } = requestSpec;

  return {
    query: (queryParams ? queryParams.parse(request.query) : {}) as ExtractQueryParams<TSpec>,
    body: (body ? body.parse(request.body) : {}) as ExtractBodyParams<TSpec>,
  };
}

/** Forwards both thrown errors and rejected promises to Express error handling. */
export function setMiddleware(middleware: ExpressMiddleware): RequestHandler {
  return async (request, response, next) => {
    try {
      await middleware(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}

export function setAPIEndpoint<TSpec extends ServerAPISpecification>(input: {
  router: Router;
  apiSpec: TSpec;
  handler: APIHandler<TSpec>;
  middlewares?: ExpressMiddleware[];
  apiEndpoint?: TSpec['APIEndpoint'];
  method?: TSpec['Method'];
}) {
  const {
    router,
    apiSpec,
    handler,
    middlewares = [],
    apiEndpoint = apiSpec.APIEndpoint,
    method = apiSpec.Method,
  } = input;

  if (apiEndpoint !== apiSpec.APIEndpoint || method !== apiSpec.Method) {
    throw new Error('Route endpoint and method must match the API specification.');
  }

  const apiMiddleware = setMiddleware((request, response, next) => handler({
    req: request,
    res: response,
    next,
    params: parseRequestParams<TSpec>(request, apiSpec.Request),
  }));
  const route = method.toLowerCase() as Lowercase<ServerAPISpecification['Method']>;

  router[route](apiEndpoint, ...middlewares, apiMiddleware);
}
