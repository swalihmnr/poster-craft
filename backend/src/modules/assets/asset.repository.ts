import { AssetModel, IAsset } from './asset.model.js';

export class AssetRepository {
  async create(data: Partial<IAsset>): Promise<IAsset> {
    const asset = new AssetModel(data);
    return asset.save();
  }

  async findById(id: string): Promise<IAsset | null> {
    return AssetModel.findById(id).exec();
  }

  async delete(id: string): Promise<IAsset | null> {
    return AssetModel.findByIdAndDelete(id).exec();
  }

  async listByOwner(ownerId: string, type?: string, page = 1, limit = 20) {
    const query: any = { ownerId };
    if (type) {
      query.type = type;
    }
    const skip = (page - 1) * limit;
    const [assets, total] = await Promise.all([
      AssetModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      AssetModel.countDocuments(query).exec(),
    ]);
    return { assets, total };
  }
}
