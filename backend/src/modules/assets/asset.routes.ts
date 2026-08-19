import { Router } from 'express';
import { AssetController } from './asset.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);
// Step 1: get a signed upload token — browser uploads directly to Cloudinary
router.post('/upload-signature', AssetController.getSignature);
// Step 2: save the Cloudinary result (url, publicId, etc.) returned by the browser
router.post('/record', AssetController.record);
router.get('/', AssetController.list);
router.delete('/:id', AssetController.delete);

export default router;
