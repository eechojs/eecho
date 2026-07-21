import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

type ExpressExceptionMiddleware = (
  error: Error,
  request: Request,
  response: Response,
  next: NextFunction,
) => void;

export const ExceptionMiddleware: ExpressExceptionMiddleware = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        issues: error.issues.map(({ code, message, path }) => ({ code, message, path })),
      },
    });
    return;
  }

  console.error('API exception occurred', {
    method: request.method,
    url: request.originalUrl,
    userAgent: request.get('User-Agent'),
    ip: request.ip,
    error,
  });

  response.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
};
