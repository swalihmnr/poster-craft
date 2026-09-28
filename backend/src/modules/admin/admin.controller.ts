import { Response, NextFunction } from 'express';
import { ProgramRepository } from '../programs/program.repository.js';
import { TemplateRepository } from '../templates/template.repository.js';
import { UserRepository } from '../users/user.repository.js';
import { PosterRepository } from '../posters/poster.repository.js';
import { ProgramModel } from '../programs/program.model.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { AuthenticatedRequest } from '../../types/index.js';

const programRepo = new ProgramRepository();
const templateRepo = new TemplateRepository();
const userRepo = new UserRepository();
const posterRepo = new PosterRepository();

export class AdminController {
  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const isSuperAdmin =
        req.user?.isSuperAdmin ||
        req.user?.email === process.env.SUPER_ADMIN_EMAIL ||
        req.user?.email === 'swalimohd048@gmail.com';

      if (isSuperAdmin) {
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
      }

      // Regular Admin: Scope strictly to this admin's tenant data
      const adminId = req.user!.userId;
      const adminPrograms = await ProgramModel.find({ createdBy: adminId }).select('_id');
      const programIds = adminPrograms.map((p) => p._id);

      const [totalPrograms, publishedPrograms, totalTemplates, totalPosterGenerations, recentActivity] =
        await Promise.all([
          programRepo.count({ createdBy: adminId }),
          programRepo.count({ createdBy: adminId, status: 'published' }),
          templateRepo.count({ createdBy: adminId }),
          posterRepo.countByProgramIds(programIds),
          posterRepo.getRecentActivityByProgramIds(programIds, 5),
        ]);

      return sendSuccess(res, {
        totalPrograms,
        publishedPrograms,
        totalTemplates,
        totalUsers: totalPosterGenerations,
        totalPosterGenerations,
        recentActivity,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const isSuperAdmin =
        req.user?.isSuperAdmin ||
        req.user?.email === process.env.SUPER_ADMIN_EMAIL ||
        req.user?.email === 'swalimohd048@gmail.com';

      if (isSuperAdmin) {
        const { users, total } = await userRepo.findAll(page, limit);
        return sendSuccess(res, { users, total, page, limit });
      }

      // Regular Admin: Return users who submitted posters on this admin's programs
      const adminId = req.user!.userId;
      const adminPrograms = await ProgramModel.find({ createdBy: adminId }).select('_id');
      const programIds = adminPrograms.map((p) => p._id);

      const { submissions, total } = await posterRepo.findByProgramIds(programIds, page, limit);

      const users = submissions.map((s: any) => ({
        _id: s._id,
        name: s.input?.name || 'Participant',
        email: s.programId?.name ? `Program: ${s.programId.name}` : 'Public User',
        role: 'user',
        status: s.status === 'completed' ? 'active' : 'pending',
        avatar: s.input?.photoUrl,
        createdAt: s.createdAt,
      }));

      return sendSuccess(res, { users, total, page, limit });
    } catch (error) {
      next(error);
    }
  }
}
