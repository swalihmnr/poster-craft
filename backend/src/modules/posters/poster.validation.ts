import { body } from 'express-validator';

export const createPosterValidation = [
  body('programId').notEmpty().withMessage('Program ID is required'),
  body('templateId').notEmpty().withMessage('Template ID is required'),
  body('input.name').trim().notEmpty().withMessage('User name is required'),
  body('format').optional().isIn(['png', 'webp']).withMessage('Format must be png or webp'),
];
