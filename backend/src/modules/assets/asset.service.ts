import { AssetRepository } from './asset.repository.js';
import { storageService } from '../../config/storage.js';
import { ApiError } from '../../utils/apiError.js';

export class AssetService {
  private assetRepo = new AssetRepository();

  async uploadAsset(fileBuffer: Buffer, originalname: string, ownerId: string, type: 'frame' | 'photo' | 'logo' | 'background' = 'photo') {
    const uploadRes = await storageService.uploadBuffer(fileBuffer, originalname, type);
    return this.assetRepo.create({
      ownerId: ownerId as any,
      type,
      provider: uploadRes.provider,
      url: uploadRes.url,
      publicId: uploadRes.publicId,
      width: uploadRes.width,
      height: uploadRes.height,
      format: uploadRes.format,
      size: uploadRes.size,
    });
  }

  async getUploadSignature(folder = 'assets') {
    if (storageService.getUploadSignature) {
      return storageService.getUploadSignature(folder);
    }
    throw ApiError.badRequest('Signed upload signature not supported with local storage provider');
  }

  async deleteAsset(id: string, userId: string, isAdmin = false) {
    const asset = await this.assetRepo.findById(id);
    if (!asset) {
      throw ApiError.notFound('Asset not found');
    }

    if (!isAdmin && asset.ownerId.toString() !== userId) {
      throw ApiError.forbidden('You are not authorized to delete this asset');
    }

    await storageService.deleteFile(asset.publicId);
    return this.assetRepo.delete(id);
  }

  async listUserAssets(ownerId: string, type?: string, page = 1, limit = 20) {
    return this.assetRepo.listByOwner(ownerId, type, page, limit);
  }
}
