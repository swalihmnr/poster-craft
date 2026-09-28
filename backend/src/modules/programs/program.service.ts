import mongoose from 'mongoose';
import crypto from 'crypto';
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

    const publicToken = crypto.randomBytes(16).toString('hex');

    return this.programRepo.create({
      status: 'published',
      ...data,
      slug,
      publicToken,
      createdBy,
    });
  }

  async getProgramById(id: string) {
    let program = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      program = await this.programRepo.findById(id);
    }

    if (!program) {
      program = await this.programRepo.findBySlug(id);
    }

    if (!program) {
      program = await this.programRepo.findByToken(id);
    }

    // Fallback: If still not found, check if there is an active program matching the prefix (handles typos)
    if (!program && id && id.length >= 8) {
      const prefix = id.substring(0, 8);
      const all = await this.programRepo.findAll({ status: { $ne: 'archived' } }, 1, 10);
      const match = all.programs.find((p: any) => p._id.toString().startsWith(prefix));
      if (match) {
        program = await this.programRepo.findById(match._id.toString());
      }
    }

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

  // Programs are private — public listing is disabled.
  // The public can only access a program via a generated shareable token link.
  async listPublicPrograms() {
    return { programs: [], total: 0 };
  }

  async getProgramByToken(token: string) {
    const program = await this.programRepo.findByToken(token);
    if (!program) {
      throw ApiError.notFound('Program not found or link has been revoked');
    }
    return program;
  }

  async generatePublicToken(id: string) {
    const program = await this.programRepo.findById(id);
    if (!program) throw ApiError.notFound('Program not found');
    return this.programRepo.generatePublicToken(id);
  }

  async revokePublicToken(id: string) {
    const program = await this.programRepo.findById(id);
    if (!program) throw ApiError.notFound('Program not found');
    return this.programRepo.revokePublicToken(id);
  }

  async listAdminPrograms(page = 1, limit = 12, search?: string, status?: string, createdBy?: string) {
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (createdBy) {
      filter.createdBy = createdBy;
    }
    return this.programRepo.findAll(filter, page, limit, search);
  }
}
