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

  async countByProgramIds(programIds: any[]): Promise<number> {
    if (!programIds.length) return 0;
    return PosterGenerationModel.countDocuments({ programId: { $in: programIds } }).exec();
  }

  async getRecentActivity(limit = 10) {
    return PosterGenerationModel.find()
      .populate('programId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getRecentActivityByProgramIds(programIds: any[], limit = 10) {
    if (!programIds.length) return [];
    return PosterGenerationModel.find({ programId: { $in: programIds } })
      .populate('programId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findByProgramIds(programIds: any[], page = 1, limit = 10) {
    if (!programIds.length) return { submissions: [], total: 0 };
    const skip = (page - 1) * limit;
    const [submissions, total] = await Promise.all([
      PosterGenerationModel.find({ programId: { $in: programIds } })
        .populate('programId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      PosterGenerationModel.countDocuments({ programId: { $in: programIds } }).exec(),
    ]);
    return { submissions, total };
  }
}
