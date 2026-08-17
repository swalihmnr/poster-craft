import { Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest, UserRole } from '../types/index.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
