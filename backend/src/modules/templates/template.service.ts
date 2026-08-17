import { TemplateRepository } from './template.repository.js';
import { ApiError } from '../../utils/apiError.js';

export class TemplateService {
  private templateRepo = new TemplateRepository();

  async createTemplate(data: any, createdBy: string) {
    if (Array.isArray(data.layers)) {
      data.layers = data.layers.map((l: any) => {
        if (typeof l === 'object' && l !== null) {
          const { _id, ...rest } = l;
          return rest;
        }
        return l;
      });
    }
    return this.templateRepo.create({ ...data, createdBy });
  }

  async getTemplateById(id: string) {
    const template = await this.templateRepo.findById(id);
    if (!template) {
      throw ApiError.notFound('Template not found');
    }
    return template;
  }

  async updateTemplate(id: string, data: any) {
    const template = await this.templateRepo.findById(id);
    if (!template) {
      throw ApiError.notFound('Template not found');
    }
    const { _id, id: docId, version, createdBy, createdAt, updatedAt, __v, ...cleanData } = data;
    
    if (Array.isArray(cleanData.layers)) {
      cleanData.layers = cleanData.layers.map((l: any) => {
        if (typeof l === 'object' && l !== null) {
          const { _id, ...rest } = l;
          return rest;
        }
        return l;
      });
    }

    return this.templateRepo.update(id, cleanData);
  }

  async deleteTemplate(id: string) {
    const template = await this.templateRepo.findById(id);
    if (!template) {
      throw ApiError.notFound('Template not found');
    }
    return this.templateRepo.delete(id);
  }

  async listTemplates(page = 1, limit = 12, status?: string) {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    return this.templateRepo.findAll(query, page, limit);
  }
}
