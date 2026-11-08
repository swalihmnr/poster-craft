import { AssetRepository } from './asset.repository.js';
import { storageService } from '../../config/storage.js';
import { ApiError } from '../../utils/apiError.js';

export class AssetService {
  private assetRepo = new AssetRepository();

  /**
   * Called after the browser has already uploaded directly to Cloudinary.
   * We just persist the resulting metadata to MongoDB.
   */
  async recordAsset(data: {
    ownerId: string;
    type: string;
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  }) {
    return this.assetRepo.create({
      ownerId: data.ownerId as any,
      type: data.type as any,
      provider: 'cloudinary',
      url: data.url,
      publicId: data.publicId,
      width: data.width,
      height: data.height,
      format: data.format,
      size: data.size,
    });
  }

  async uploadAsset(
    fileBuffer: Buffer,
    originalname: string,
    ownerId: string,
    type: 'frame' | 'photo' | 'logo' | 'background' | 'psd' = 'photo'
  ) {
    const uploadRes = await storageService.uploadBuffer(fileBuffer, originalname, type);
    return this.assetRepo.create({
      ownerId: ownerId as any,
      type: type as any,
      provider: uploadRes.provider,
      url: uploadRes.url,
      publicId: uploadRes.publicId,
      width: uploadRes.width,
      height: uploadRes.height,
      format: uploadRes.format,
      size: uploadRes.size,
    });
  }

  async getUploadSignature(folder = 'poster_saas') {
    if (storageService.getUploadSignature) {
      return storageService.getUploadSignature(folder);
    }
    return null;
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

