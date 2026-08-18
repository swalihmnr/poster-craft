import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { env } from '../../config/env.js';

const authService = new AuthService();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role } = req.body;
      const { user, tokens } = await authService.register(name, email, password, role);

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      return sendSuccess(res, { user, accessToken: tokens.accessToken }, 201, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, tokens } = await authService.login(email, password);

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      return sendSuccess(res, { user, accessToken: tokens.accessToken }, 200, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async googleAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ success: false, error: { message: 'Google credential token is required' } });
      }
      const { user, tokens } = await authService.googleAuth(credential);
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      return sendSuccess(res, { user, accessToken: tokens.accessToken }, 200, 'Google Authentication successful');
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie('refreshToken', COOKIE_OPTIONS);
      return sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        return res.status(401).json({ success: false, error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token missing' } });
      }

      const tokens = await authService.refreshToken(token);
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      return sendSuccess(res, { accessToken: tokens.accessToken });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getMe(req.user!.userId);
      return sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  }

  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.sendOtp(email);
      return sendSuccess(res, result, 200, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async cancelOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.cancelOtp(email);
      return sendSuccess(res, result, 200, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, name, phone, password } = req.body;
      const { user, tokens } = await authService.verifyOtp(email, otp, name, phone, password);
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
      return sendSuccess(res, { user, accessToken: tokens.accessToken }, 200, 'OTP verified successfully');
    } catch (error) {
      next(error);
    }
  }
}
