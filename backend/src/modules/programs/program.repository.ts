import { ProgramModel, IProgram } from './program.model.js';
import crypto from 'crypto';

export class ProgramRepository {
  async findById(id: string): Promise<IProgram | null> {
    return ProgramModel.findById(id)
      .populate('templateId')
      .populate('createdBy', 'name email')
      .exec();
  }

  async findBySlug(slug: string): Promise<IProgram | null> {
    return ProgramModel.findOne({ slug: slug.toLowerCase() })
      .populate('templateId')
      .exec();
  }

  async create(data: Partial<IProgram>): Promise<IProgram> {
    const program = new ProgramModel(data);
    return program.save();
  }

  async update(id: string, data: Partial<IProgram>): Promise<IProgram | null> {
    return ProgramModel.findByIdAndUpdate(id, { $set: data }, { new: true })
      .populate('templateId')
      .exec();
  }

  async updateStatus(id: string, status: 'draft' | 'published' | 'archived'): Promise<IProgram | null> {
    return ProgramModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  async delete(id: string): Promise<IProgram | null> {
    return ProgramModel.findByIdAndDelete(id).exec();
  }

  async findByToken(token: string): Promise<IProgram | null> {
    return ProgramModel.findOne({ publicToken: token })
      .populate('templateId')
      .exec();
  }

  async generatePublicToken(id: string): Promise<IProgram | null> {
    const token = crypto.randomBytes(16).toString('hex'); // 32-char hex
    return ProgramModel.findByIdAndUpdate(
      id,
      { $set: { publicToken: token } },
      { new: true }
    ).exec();
  }

  async revokePublicToken(id: string): Promise<IProgram | null> {
    return ProgramModel.findByIdAndUpdate(
      id,
      { $unset: { publicToken: '' } },
      { new: true }
    ).exec();
  }

  async findAll(
    filter: any = {},
    page = 1,
    limit = 12,
    search?: string
  ): Promise<{ programs: IProgram[]; total: number }> {
    const query: any = { ...filter };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [programs, total] = await Promise.all([
      ProgramModel.find(query)
        .populate('templateId', 'name width height thumbnail layers')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ProgramModel.countDocuments(query).exec(),
    ]);

    return { programs, total };
  }

  async count(filter: any = {}): Promise<number> {
    return ProgramModel.countDocuments(filter).exec();
  }
}
