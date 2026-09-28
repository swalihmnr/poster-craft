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

// ─── Public routes ───────────────────────────────────────────────────────────
// Programs list is private — returns empty. Direct access is allowed via ID, slug, or shareable token.
router.get('/programs', ProgramController.listPublic);
router.get('/programs/id/:id', ProgramController.getById);
router.get('/programs/:slug', ProgramController.getBySlug);
// Shareable public link: /p/:token  (no login required)
router.get('/p/:token', ProgramController.getByToken);

// ─── Admin routes ─────────────────────────────────────────────────────────────
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
// Link management
router.post('/admin/programs/:id/generate-link', ProgramController.generatePublicLink);
router.delete('/admin/programs/:id/revoke-link', ProgramController.revokePublicLink);

export default router;
