import { ProgramRepository } from './program.repository.js';
import { TemplateRepository } from '../templates/template.repository.js';
import { ApiError } from '../../utils/apiError.js';

export class ProgramService {
  private programRepo = new ProgramRepository();
  private templateRepo = new TemplateRepository();

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async createProgram(data: any, createdBy: string) {
    const template = await this.templateRepo.findById(data.templateId);
    if (!template) {
      throw ApiError.notFound('Associated template not found');
    }

    let slug = data.slug || this.generateSlug(data.name);
    const existing = await this.programRepo.findBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    return this.programRepo.create({
      status: 'published',
      ...data,
      slug,
      createdBy,
    });
  }

  async getProgramById(id: string) {
    const program = await this.programRepo.findById(id);
    if (!program) {
      throw ApiError.notFound('Program not found');
    }
    return program;
  }

  async getProgramBySlug(slug: string) {
    const program = await this.programRepo.findBySlug(slug);
    if (!program) {
      throw ApiError.notFound('Program not found');
    }
    return program;
  }

  async updateProgram(id: string, data: any) {
    const program = await this.programRepo.findById(id);
    if (!program) {
      throw ApiError.notFound('Program not found');
    }

    if (data.templateId) {
      const template = await this.templateRepo.findById(data.templateId);
      if (!template) {
        throw ApiError.notFound('Associated template not found');
      }
    }

    if (data.name && !data.slug) {
      data.slug = this.generateSlug(data.name);
    }

    return this.programRepo.update(id, data);
  }

  async updateProgramStatus(id: string, status: 'draft' | 'published' | 'archived') {
    const program = await this.programRepo.findById(id);
    if (!program) {
      throw ApiError.notFound('Program not found');
    }
    return this.programRepo.updateStatus(id, status);
  }

  async deleteProgram(id: string) {
    const program = await this.programRepo.findById(id);
    if (!program) {
      throw ApiError.notFound('Program not found');
    }
    return this.programRepo.delete(id);
  }

  async listPublicPrograms(page = 1, limit = 12, search?: string) {
    const published = await this.programRepo.findAll({ status: 'published' }, page, limit, search);
    if (published.total > 0) {
      return published;
    }
    return this.programRepo.findAll({ status: { $ne: 'archived' } }, page, limit, search);
  }

  async listAdminPrograms(page = 1, limit = 12, search?: string, status?: string) {
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    return this.programRepo.findAll(filter, page, limit, search);
  }
}
