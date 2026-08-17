import { PosterGenerationModel, IPosterGeneration } from './poster.model.js';

export class PosterRepository {
  async create(data: Partial<IPosterGeneration>): Promise<IPosterGeneration> {
    const doc = new PosterGenerationModel(data);
    return doc.save();
  }

  async findById(id: string): Promise<IPosterGeneration | null> {
    return PosterGenerationModel.findById(id)
      .populate('programId')
      .populate('templateId')
      .exec();
  }

  async countTotal(): Promise<number> {
    return PosterGenerationModel.countDocuments().exec();
  }

  async getRecentActivity(limit = 10) {
    return PosterGenerationModel.find()
      .populate('programId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
