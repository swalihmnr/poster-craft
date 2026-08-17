import { Request, Response, NextFunction } from 'express';
import { ProgramRepository } from '../programs/program.repository.js';
import { TemplateRepository } from '../templates/template.repository.js';
import { UserRepository } from '../users/user.repository.js';
import { PosterRepository } from '../posters/poster.repository.js';
import { sendSuccess } from '../../utils/apiResponse.js';

const programRepo = new ProgramRepository();
const templateRepo = new TemplateRepository();
const userRepo = new UserRepository();
const posterRepo = new PosterRepository();

export class AdminController {
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const [totalPrograms, publishedPrograms, totalTemplates, totalUsers, totalPosterGenerations, recentActivity] =
        await Promise.all([
          programRepo.count(),
          programRepo.count({ status: 'published' }),
          templateRepo.count(),
          userRepo.count(),
          posterRepo.countTotal(),
          posterRepo.getRecentActivity(5),
        ]);

      return sendSuccess(res, {
        totalPrograms,
        publishedPrograms,
        totalTemplates,
        totalUsers,
        totalPosterGenerations,
        recentActivity,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { users, total } = await userRepo.findAll(page, limit);
      return sendSuccess(res, { users, total, page, limit });
    } catch (error) {
      next(error);
    }
  }
}
