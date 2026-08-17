import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest, IUserPayload } from '../types/index.js';

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new ApiError(401, 'Access token is missing', 'TOKEN_EXPIRED'));
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as IUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Access token expired', 'TOKEN_EXPIRED'));
    }
    return next(new ApiError(401, 'Invalid access token', 'TOKEN_EXPIRED'));
  }
}

export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return next(ApiError.forbidden('Admin privileges required'));
  }
  next();
}

export function requireSuperAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin' || req.user.email.toLowerCase() !== 'swalimohd048@gmail.com') {
    return next(ApiError.forbidden('Super Admin privileges required'));
  }
  next();
}
