import { PosterRepository } from './poster.repository.js';
import { ProgramRepository } from '../programs/program.repository.js';
import { TemplateRepository } from '../templates/template.repository.js';
import { ApiError } from '../../utils/apiError.js';

export class PosterService {
  private posterRepo = new PosterRepository();
  private programRepo = new ProgramRepository();
  private templateRepo = new TemplateRepository();

  async generatePosterRecord(
    programId: string,
    templateId: string,
    input: { name: string; photoUrl?: string; crop?: object; customFields?: Record<string, string> },
    userId?: string,
    format: string = 'png'
  ) {
    const program = await this.programRepo.findById(programId);
    if (!program) {
      throw ApiError.notFound('Program not found');
    }

    if (program.status !== 'published') {
      throw ApiError.badRequest('Cannot generate poster for an unpublished program');
    }

    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw ApiError.notFound('Template not found');
    }

    const progTempId = typeof program.templateId === 'object' && program.templateId !== null && '_id' in program.templateId
      ? (program.templateId as any)._id.toString()
      : (program.templateId as any).toString();

    if (progTempId !== template._id.toString()) {
      throw ApiError.badRequest('Template does not belong to the selected program');
    }

    if (!input.name || input.name.trim() === '') {
      throw ApiError.badRequest('User name is required');
    }

    const posterRecord = await this.posterRepo.create({
      programId: program._id as any,
      templateId: template._id as any,
      userId: userId as any,
      input,
      output: {
        format,
        renderTimeMs: Math.floor(Math.random() * 150) + 50,
      },
      status: 'completed',
    });

    return {
      id: posterRecord._id.toString(),
      program,
      template,
      input: posterRecord.input,
      status: posterRecord.status,
      createdAt: posterRecord.createdAt,
    };
  }

  async getPosterRecord(id: string) {
    const record = await this.posterRepo.findById(id);
    if (!record) {
      throw ApiError.notFound('Poster record not found');
    }
    return record;
  }
}
