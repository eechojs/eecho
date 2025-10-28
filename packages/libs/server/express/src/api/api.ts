import { Router, Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import { ServerAPISpecification } from "@eecho/definition";

import type { APIHandler, ExpressMiddleware, ExtractBodyParams, ExtractQueryParams } from "./api.type";
import { parseRequestParams, registerRoute } from "./api.util";

export const setMiddleware = <TResult>(fn: ExpressMiddleware<TResult>) => {
  return (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const setAPIEndpoint = <TSpec extends ServerAPISpecification>(
  input: {
    router: Router;
    apiEndpoint: TSpec['APIEndpoint'];
    method: TSpec['Method'];
    middlewares?: ExpressMiddleware[];
    apiSpec: TSpec;
    handler: APIHandler<TSpec>;
  },
) => {
  const { router, middlewares = [], apiSpec, handler } = input;
  const { APIEndpoint, Method, Request } = apiSpec;

  const apiMiddleware = setMiddleware((req, res, next) => {
    const { queryParams, bodyParams } = parseRequestParams(req, Request);
    
    return handler({ 
      req, 
      res, 
      next, 
      params: {
        query: queryParams as ExtractQueryParams<TSpec>,
        body: bodyParams as ExtractBodyParams<TSpec>
      }
    });
  });

  const allMiddlewares = [...middlewares, apiMiddleware];
  registerRoute(router, Method, APIEndpoint, allMiddlewares);
};
