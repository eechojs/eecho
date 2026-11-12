import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

// Express recognizes error middleware by its four declared parameters, so `_next` must stay.
export const ExceptionMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
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
