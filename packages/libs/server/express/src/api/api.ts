import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse, Router } from 'express';

import type { ServerAPISpecification } from '@eecho/definition';

import type { APIHandler, ExpressMiddleware } from './api.type.js';
import { parseRequestParams, registerRoute } from './api.util.js';

export function setMiddleware<TResult>(middleware: ExpressMiddleware<TResult>) {
  return (request: ExpressRequest, response: ExpressResponse, next: NextFunction) => {
    return Promise.resolve(middleware(request, response, next)).catch(next);
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

  const apiMiddleware = setMiddleware((request, response, next) => {
    const { queryParams, bodyParams } = parseRequestParams<TSpec>(request, apiSpec.Request);

    return handler({
      req: request,
      res: response,
      next,
      params: {
        query: queryParams,
        body: bodyParams,
      },
    });
  });

  registerRoute(router, method, apiEndpoint, [...middlewares, apiMiddleware]);
}
