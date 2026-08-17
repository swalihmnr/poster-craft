import { Response, NextFunction } from 'express';
import { AssetService } from './asset.service.js';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse.js';
import { AuthenticatedRequest } from '../../types/index.js';

const assetService = new AssetService();

export class AssetController {
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
      }

      const type = (req.body.type as any) || 'photo';
      const asset = await assetService.uploadAsset(
        req.file.buffer,
        req.file.originalname,
        req.user!.userId,
        type
      );

      return sendSuccess(res, asset, 201, 'Asset uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getSignature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const folder = (req.query.folder as string) || 'assets';
      const signatureInfo = await assetService.getUploadSignature(folder);
      return sendSuccess(res, signatureInfo);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const isAdmin = req.user?.role === 'admin';
      await assetService.deleteAsset(id, req.user!.userId, isAdmin);
      return sendSuccess(res, { message: 'Asset deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;

      const { assets, total } = await assetService.listUserAssets(req.user!.userId, type, page, limit);
      return sendPaginated(res, assets, page, limit, total);
    } catch (error) {
      next(error);
    }
  }
}
