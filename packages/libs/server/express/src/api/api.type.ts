import type { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { z } from 'zod';

import type { ServerAPISpecification } from '@eecho/definition';

export type ExtractQueryParams<TSpec extends ServerAPISpecification> =
  TSpec['Request']['queryParams'] extends z.ZodTypeAny
    ? z.output<TSpec['Request']['queryParams']>
    : Record<string, never>;

export type ExtractBodyParams<TSpec extends ServerAPISpecification> =
  TSpec['Request']['body'] extends z.ZodTypeAny
    ? z.output<TSpec['Request']['body']>
    : Record<string, never>;

export type ExtractResponseType<TSpec extends ServerAPISpecification> =
  TSpec['Response']['body'] extends z.ZodTypeAny
    ? z.output<TSpec['Response']['body']>
    : unknown;

export type APIHandler<TSpec extends ServerAPISpecification> = (options: {
  req: ExpressRequest;
  res: ExpressResponse;
  params: {
    query: ExtractQueryParams<TSpec>;
    body: ExtractBodyParams<TSpec>;
  };
  next: NextFunction;
}) => ExtractResponseType<TSpec> | Promise<ExtractResponseType<TSpec>>;

export type ExpressMiddleware<TReturn = unknown> = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction,
) => TReturn | Promise<TReturn>;
