import { TemplateModel, ITemplate } from './template.model.js';

export class TemplateRepository {
  async findById(id: string): Promise<ITemplate | null> {
    return TemplateModel.findById(id).populate('createdBy', 'name email').exec();
  }

  async create(data: Partial<ITemplate>): Promise<ITemplate> {
    const template = new TemplateModel(data);
    return template.save();
  }

  async update(id: string, data: Partial<ITemplate>): Promise<ITemplate | null> {
    return TemplateModel.findByIdAndUpdate(
      id,
      { $set: data, $inc: { version: 1 } },
      { new: true }
    ).exec();
  }

  async delete(id: string): Promise<ITemplate | null> {
    return TemplateModel.findByIdAndDelete(id).exec();
  }

  async findAll(query: any = {}, page = 1, limit = 12): Promise<{ templates: ITemplate[]; total: number }> {
    const skip = (page - 1) * limit;
    const [templates, total] = await Promise.all([
      TemplateModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).exec(),
      TemplateModel.countDocuments(query).exec(),
    ]);
    return { templates, total };
  }

  async count(): Promise<number> {
    return TemplateModel.countDocuments().exec();
  }
}
