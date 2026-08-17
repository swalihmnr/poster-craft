import { body, param } from 'express-validator';

export const createTemplateValidation = [
  body('name').trim().notEmpty().withMessage('Template name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('width').optional().isNumeric().withMessage('Width must be a number'),
  body('height').optional().isNumeric().withMessage('Height must be a number'),
  body('background').optional(),
  body('layers').optional().isArray().withMessage('Layers must be an array'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Status must be draft, published, or archived'),
];

export const updateTemplateValidation = [
  param('id').notEmpty().withMessage('Template ID param is required'),
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('layers').optional().isArray().withMessage('Layers must be an array'),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Status must be draft, published, or archived'),
];
