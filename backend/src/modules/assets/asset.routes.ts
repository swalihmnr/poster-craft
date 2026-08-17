import { Router } from 'express';
import multer from 'multer';
import { AssetController } from './asset.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for high-res design files
  fileFilter: (_req, file, cb) => {
    const isSupported =
      file.mimetype.startsWith('image/') ||
      file.mimetype.match(/(photoshop|adobe|vnd\.adobe)/i) ||
      file.originalname.match(/\.(psd|png|jpg|jpeg|webp|svg|tiff|bmp)$/i);

    if (isSupported) {
      cb(null, true);
    } else {
      cb(new Error('Allowed file formats: PSD, PNG, JPEG, WebP, SVG, TIFF, BMP'));
    }
  },
});

const router = Router();

router.use(requireAuth);
router.post('/upload', upload.single('file'), AssetController.upload);
router.post('/upload-signature', AssetController.getSignature);
router.get('/', AssetController.list);
router.delete('/:id', AssetController.delete);

export default router;
