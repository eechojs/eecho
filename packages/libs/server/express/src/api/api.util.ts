import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction, Router } from "express";
import { z } from "zod";

import { ExpressMiddleware } from "./api.type";
import { ServerAPISpecification } from "@eecho/definition";

export const parseRequestParams = <TSpec extends ServerAPISpecification>(
  req: ExpressRequest,
  requestSpec: TSpec['Request']
) => {
  type QueryParamsType = TSpec['Request']['queryParams'] extends z.ZodTypeAny 
    ? z.infer<TSpec['Request']['queryParams']> 
    : Record<string, any>;
    
  type BodyParamsType = TSpec['Request']['body'] extends z.ZodTypeAny 
    ? z.infer<TSpec['Request']['body']> 
    : Record<string, any>;

  let queryParams: QueryParamsType = {} as QueryParamsType;
  let bodyParams: BodyParamsType = {} as BodyParamsType;

  if (requestSpec.queryParams) {
    queryParams = requestSpec.queryParams.parse(req.query) as QueryParamsType;
  }

  if (requestSpec.body) {
    bodyParams = requestSpec.body.parse(req.body) as BodyParamsType;
  }

  return { queryParams, bodyParams };
};

export const registerRoute = (
  router: Router,
  method: ServerAPISpecification['Method'],
  endpoint: string,
  middlewares: ExpressMiddleware[]
) => {
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
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
};
