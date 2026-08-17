import { body } from 'express-validator';

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('Invalid email address'),
  body('phone').optional().trim(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
];

export const loginValidation = [
  body('email').trim().isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const sendOtpValidation = [
  body('email').trim().isEmail().withMessage('Valid email address is required to receive OTP'),
  body('name').optional().trim(),
  body('phone').optional().trim(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const verifyOtpValidation = [
  body('email').trim().isEmail().withMessage('Valid email address is required'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('6-digit OTP code is required'),
  body('name').optional().trim(),
  body('phone').optional().trim(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
