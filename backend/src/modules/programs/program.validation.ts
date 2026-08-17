import { body, param } from 'express-validator';

export const createProgramValidation = [
  body('name').trim().notEmpty().withMessage('Program name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('slug').optional().trim(),
  body('description').optional().trim(),
  body('templateId').notEmpty().withMessage('Template ID is required'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Status must be draft, published, or archived'),
];

export const updateProgramValidation = [
  param('id').notEmpty().withMessage('Program ID param is required'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Status must be draft, published, or archived'),
];

export const updateProgramStatusValidation = [
  param('id').notEmpty().withMessage('Program ID param is required'),
  body('status').isIn(['draft', 'published', 'archived']).withMessage('Status must be draft, published, or archived'),
];
