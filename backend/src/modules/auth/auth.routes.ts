import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema } from './auth.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/google', authRateLimiter, AuthController.googleAuth);
router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refreshToken);
router.get('/me', requireAuth, AuthController.getMe);

export default router;
