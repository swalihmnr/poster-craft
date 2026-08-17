import { Router } from 'express';
import { UserController } from './user.controller.js';
import { requireAuth, requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';

const router = Router();

router.get('/admin-requests', requireAuth, requireSuperAdmin, UserController.getPendingAdminRequests);
router.patch('/admin-requests/:userId/approve', requireAuth, requireSuperAdmin, UserController.approveAdminRequest);
router.patch('/admin-requests/:userId/reject', requireAuth, requireSuperAdmin, UserController.rejectAdminRequest);
router.get('/', requireAuth, requireSuperAdmin, UserController.getAllUsers);
router.delete('/:userId', requireAuth, requireSuperAdmin, UserController.deleteUser);

export default router;
