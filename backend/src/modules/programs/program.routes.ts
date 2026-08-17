import { Router } from 'express';
import { ProgramController } from './program.controller.js';
import { handleValidationErrors } from '../../middleware/validate.js';
import {
  createProgramValidation,
  updateProgramValidation,
  updateProgramStatusValidation,
} from './program.validation.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/authorization.js';

const router = Router();

// Public routes
router.get('/programs', ProgramController.listPublic);
router.get('/programs/:slug', ProgramController.getBySlug);
router.get('/programs/id/:id', ProgramController.getById);

// Admin routes
router.use('/admin/programs', requireAuth, requireAdmin);
router.post('/admin/programs', createProgramValidation, handleValidationErrors, ProgramController.create);
router.get('/admin/programs', ProgramController.listAdmin);
router.get('/admin/programs/:id', ProgramController.getById);
router.patch('/admin/programs/:id', updateProgramValidation, handleValidationErrors, ProgramController.update);
router.patch(
  '/admin/programs/:id/status',
  updateProgramStatusValidation,
  handleValidationErrors,
  ProgramController.updateStatus
);
router.delete('/admin/programs/:id', ProgramController.delete);

export default router;
