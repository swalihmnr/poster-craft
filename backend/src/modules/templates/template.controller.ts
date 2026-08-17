import { Request, Response, NextFunction } from 'express';
import { TemplateService } from './template.service.js';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse.js';
import { AuthenticatedRequest } from '../../types/index.js';

const templateService = new TemplateService();

export class TemplateController {
  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const template = await templateService.createTemplate(req.body, req.user!.userId);
      return sendSuccess(res, template, 201, 'Template created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const template = await templateService.getTemplateById(id);
      return sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const template = await templateService.updateTemplate(id, req.body);
      return sendSuccess(res, template, 200, 'Template updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await templateService.deleteTemplate(id);
      return sendSuccess(res, { message: 'Template deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const status = req.query.status as string;

      const { templates, total } = await templateService.listTemplates(page, limit, status);
      return sendPaginated(res, templates, page, limit, total);
    } catch (error) {
      next(error);
    }
  }
}
