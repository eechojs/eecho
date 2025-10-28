import { z } from "zod";
import { NextFunction, Request as ExpressRequest, Response as ExpressResponse } from "express";

type ExpressExceptionMiddleware = (err: Error, req: ExpressRequest, res: ExpressResponse, next: NextFunction) => void;

export const ExceptionMiddleware: ExpressExceptionMiddleware = (err, req, res, next) => {
  console.error('API Exception occurred', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    error: err
  });

  return res.status(500).json({
    success: false,
    message: "EXCEPTION_MIDDLEWARE_UNKNOWN_ERROR"
  });
};
