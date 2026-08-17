import { Router } from 'express';
import { TemplateController } from './template.controller.js';
import { handleValidationErrors } from '../../middleware/validate.js';
import { createTemplateValidation, updateTemplateValidation } from './template.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/authorization.js';

const router = Router();

// Admin routes for template management
router.use('/admin/templates', requireAuth, requireAdmin);
router.post('/admin/templates', createTemplateValidation, handleValidationErrors, TemplateController.create);
router.get('/admin/templates', TemplateController.list);
router.get('/admin/templates/:id', TemplateController.getById);
router.patch('/admin/templates/:id', updateTemplateValidation, handleValidationErrors, TemplateController.update);
router.delete('/admin/templates/:id', TemplateController.delete);

// Public / User route to fetch template detail by ID
router.get('/templates/:id', TemplateController.getById);

export default router;
