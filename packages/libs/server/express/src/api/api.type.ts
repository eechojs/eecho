import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { z } from 'zod';

import { ServerAPISpecification } from '@eecho/definition';

export type ExtractQueryParams<TSpec extends ServerAPISpecification> = TSpec['Request']['queryParams'] extends z.ZodTypeAny 
  ? z.infer<TSpec['Request']['queryParams']> 
  : {};

export type ExtractBodyParams<TSpec extends ServerAPISpecification> = TSpec['Request']['body'] extends z.ZodTypeAny 
  ? z.infer<TSpec['Request']['body']> 
  : {};

export type ExtractResponseType<TSpec extends ServerAPISpecification> = TSpec['Response']['body'] extends z.ZodTypeAny 
  ? z.infer<TSpec['Response']['body']> 
  : any;

export type APIHandler<TSpec extends ServerAPISpecification> = (opts: {
  req: ExpressRequest;
  res: ExpressResponse;
  params: {
    query: ExtractQueryParams<TSpec>;
    body: ExtractBodyParams<TSpec>;
  };
  next?: NextFunction;
}) => ExtractResponseType<TSpec> | Promise<ExtractResponseType<TSpec>>;

export type ExpressMiddleware<TReturn = any> = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) => TReturn | Promise<TReturn>;