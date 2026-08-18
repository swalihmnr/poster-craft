import { Response, NextFunction } from 'express';
import { AssetService } from './asset.service.js';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse.js';
import { AuthenticatedRequest } from '../../types/index.js';

const assetService = new AssetService();

export class AssetController {
  /**
   * Step 1 of direct Cloudinary upload:
   * Returns a signed signature so the browser can upload directly to Cloudinary.
   */
  static async getSignature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const folder = (req.query.folder as string) || 'poster_saas';
      const signatureInfo = await assetService.getUploadSignature(folder);
      return sendSuccess(res, signatureInfo);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Step 2 of direct Cloudinary upload:
   * Browser has uploaded directly to Cloudinary. It sends back the result here.
   * We just save the metadata (url, publicId, etc.) to MongoDB.
   */
  static async record(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { url, publicId, width, height, format, size, type } = req.body;
      if (!url || !publicId) {
        return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'url and publicId are required' } });
      }
      const asset = await assetService.recordAsset({
        ownerId: req.user!.userId,
        type: type || 'photo',
        url,
        publicId,
        width,
        height,
        format,
        size,
      });
      return sendSuccess(res, asset, 201, 'Asset recorded successfully');
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

