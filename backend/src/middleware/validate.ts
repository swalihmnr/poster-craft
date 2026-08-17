import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';

export function validate(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = (error as any).issues || (error as any).errors || [];
        const details = issues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join('.').replace(/^(body|query|params)\./, '') : '',
          message: e.message,
        }));
        return next(ApiError.badRequest('Validation failed', details));
      }
      next(error);
    }
  };
}
