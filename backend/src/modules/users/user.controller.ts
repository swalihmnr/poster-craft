import { Request, Response, NextFunction } from 'express';
import { UserRepository } from './user.repository.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { sendAdminApprovalNotification, sendAdminRejectionNotification } from '../../utils/emailService.js';

import { UserModel } from './user.model.js';

const userRepo = new UserRepository();

export class UserController {
  static async getPendingAdminRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await userRepo.findPendingRequests();
      return sendSuccess(res, { requests }, 200, 'Pending admin requests fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async approveAdminRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const user = await userRepo.findById(userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      user.status = 'active';
      user.role = 'admin';
      await user.save();

      // Dispatch approval email
      sendAdminApprovalNotification(user.email, user.name).catch(() => {});

      return sendSuccess(res, { user }, 200, `Admin request for ${user.email} approved successfully`);
    } catch (error) {
      next(error);
    }
  }

  static async rejectAdminRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const user = await userRepo.findById(userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      user.status = 'rejected';
      await user.save();

      // Dispatch rejection email
      sendAdminRejectionNotification(user.email, user.name).catch(() => {});

      return sendSuccess(res, { user }, 200, `Admin request for ${user.email} declined successfully`);
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const user = await userRepo.findById(userId);
      if (!user) {
        throw ApiError.notFound('User not found');
      }
      if (user.email === 'swalimohd048@gmail.com') {
        throw ApiError.forbidden('Cannot delete primary Super Admin account');
      }

      await UserModel.deleteOne({ _id: userId });
      return sendSuccess(res, { message: `User ${user.email} permanently deleted` }, 200, 'User deleted');
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const result = await userRepo.findAll(page, limit);
      return sendSuccess(res, result, 200, 'Users fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}
