import type { Request as ExpressRequest, Router } from 'express';

import type { ServerAPISpecification } from '@eecho/definition';

import type { ExpressMiddleware, ExtractBodyParams, ExtractQueryParams } from './api.type.js';

export function parseRequestParams<TSpec extends ServerAPISpecification>(
  request: ExpressRequest,
  requestSpec: TSpec['Request'],
) {
  const queryParams = requestSpec.queryParams
    ? requestSpec.queryParams.parse(request.query) as ExtractQueryParams<TSpec>
    : {} as ExtractQueryParams<TSpec>;
  const bodyParams = requestSpec.body
    ? requestSpec.body.parse(request.body) as ExtractBodyParams<TSpec>
    : {} as ExtractBodyParams<TSpec>;

  return { queryParams, bodyParams };
}

export function registerRoute(
  router: Router,
  method: ServerAPISpecification['Method'],
  endpoint: string,
  middlewares: readonly ExpressMiddleware[],
) {
  switch (method) {
    case 'GET':
      router.get(endpoint, ...middlewares);
      break;
    case 'POST':
      router.post(endpoint, ...middlewares);
      break;
    case 'PUT':
      router.put(endpoint, ...middlewares);
      break;
    case 'PATCH':
      router.patch(endpoint, ...middlewares);
      break;
    case 'DELETE':
      router.delete(endpoint, ...middlewares);
      break;
  }
}
