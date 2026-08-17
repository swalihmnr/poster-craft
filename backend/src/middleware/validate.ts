import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

export function handleValidationErrors(req: Request, _res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((err: any) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  next();
}
