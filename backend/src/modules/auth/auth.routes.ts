import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { handleValidationErrors } from '../../middleware/validate.js';
import { registerValidation, loginValidation, sendOtpValidation, verifyOtpValidation } from './auth.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, registerValidation, handleValidationErrors, AuthController.register);
router.post('/login', authRateLimiter, loginValidation, handleValidationErrors, AuthController.login);
router.post('/google', authRateLimiter, AuthController.googleAuth);
router.post('/send-otp', authRateLimiter, sendOtpValidation, handleValidationErrors, AuthController.sendOtp);
router.post('/cancel-otp', authRateLimiter, AuthController.cancelOtp);
router.post('/verify-otp', authRateLimiter, verifyOtpValidation, handleValidationErrors, AuthController.verifyOtp);
router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refreshToken);
router.get('/me', requireAuth, AuthController.getMe);

export default router;
