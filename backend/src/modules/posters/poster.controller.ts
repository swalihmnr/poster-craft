import { Request, Response, NextFunction } from 'express';
import { PosterService } from './poster.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthenticatedRequest } from '../../types/index.js';

const posterService = new PosterService();

export class PosterController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { programId, templateId, input, format } = req.body;
      const userId = req.user?.userId;

      const record = await posterService.generatePosterRecord(
        programId,
        templateId,
        input,
        userId,
        format
      );

      return sendSuccess(res, record, 201, 'Poster generation logged successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const record = await posterService.getPosterRecord(id);
      return sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  }
}
