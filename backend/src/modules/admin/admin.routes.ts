import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/authorization.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/analytics', AdminController.getStats);
router.get('/users', AdminController.listUsers);

export default router;
