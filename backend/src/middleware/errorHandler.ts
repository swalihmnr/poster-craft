import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details: any = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    details = err.details;
    if (details && Array.isArray(details) && details.length > 0) {
      message = `${err.message}: ${details.map((d: any) => `${d.field ? `${d.field}: ` : ''}${d.message}`).join(', ')}`;
    } else {
      message = err.message;
    }
  } else {
    logger.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled Exception');
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
}
