import { Request, Response, NextFunction } from 'express';
import { ProgramService } from './program.service.js';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse.js';
import { AuthenticatedRequest } from '../../types/index.js';

const programService = new ProgramService();

export class ProgramController {
  // Public handlers
  static async listPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const search = req.query.search as string;

      const { programs, total } = await programService.listPublicPrograms(page, limit, search);
      return sendPaginated(res, programs, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
      const program = await programService.getProgramBySlug(slug);
      return sendSuccess(res, program);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const program = await programService.getProgramById(id);
      return sendSuccess(res, program);
    } catch (error) {
      next(error);
    }
  }

  // Admin handlers
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const program = await programService.createProgram(req.body, req.user!.userId);
      return sendSuccess(res, program, 201, 'Program created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const { programs, total } = await programService.listAdminPrograms(page, limit, search, status);
      return sendPaginated(res, programs, page, limit, total);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const program = await programService.updateProgram(id, req.body);
      return sendSuccess(res, program, 200, 'Program updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const program = await programService.updateProgramStatus(id, req.body.status);
      return sendSuccess(res, program, 200, 'Program status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await programService.deleteProgram(id);
      return sendSuccess(res, { message: 'Program deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
