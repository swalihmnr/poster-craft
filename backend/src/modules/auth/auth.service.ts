import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../users/user.repository.js';
import { OtpModel } from './otp.model.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/apiError.js';
import { IUserPayload, UserRole } from '../../types/index.js';

import { sendOtpEmail, sendAdminRequestNotification } from '../../utils/emailService.js';

export class AuthService {
  private userRepo = new UserRepository();

  public generateTokens(userId: string, email: string, role: UserRole) {
    const payload: IUserPayload = { userId, email, role };
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });
    return { accessToken, refreshToken };
  }

  async register(name: string, email: string, password: string, role: UserRole = 'user') {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.userRepo.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      status: 'active',
    });

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email, true);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status === 'pending') {
      throw ApiError.forbidden('Your registration request is pending Super Admin approval.');
    }

    if (user.status === 'rejected') {
      throw ApiError.forbidden('Your registration request was declined by the Super Admin.');
    }

    if (user.status === 'blocked') {
      throw ApiError.forbidden('Your account has been blocked');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  async googleAuth(email: string, name?: string, avatar?: string) {
    const cleanEmail = email.toLowerCase();
    let user = await this.userRepo.findByEmail(cleanEmail);

    const isAdminEmail = cleanEmail === 'swalimohd048@gmail.com' || cleanEmail.includes('admin');
    const assignedRole: UserRole = isAdminEmail ? 'admin' : 'user';

    if (!user) {
      const dummyPassword = await bcrypt.hash(`google_${Date.now()}_${Math.random()}`, 10);
      user = await this.userRepo.create({
        name: name || (isAdminEmail ? 'PosterCraft Admin' : 'Google User'),
        email: cleanEmail,
        passwordHash: dummyPassword,
        role: assignedRole,
        avatar,
        status: 'active',
      });
    } else if (user.status === 'blocked') {
      throw ApiError.forbidden('Your account has been blocked');
    } else if (isAdminEmail && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as IUserPayload;
      const user = await this.userRepo.findById(decoded.userId);
      if (!user || user.status === 'blocked') {
        throw ApiError.unauthorized('User not found or blocked');
      }
      const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
      return tokens;
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return this.sanitizeUser(user);
  }

  public sanitizeUser(user: any) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  async sendOtp(email: string) {
    const cleanEmail = email.toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await OtpModel.deleteMany({ email: cleanEmail });

    await OtpModel.create({
      email: cleanEmail,
      otp,
      createdAt: new Date(),
    });

    console.log(`🔑 [OTP SYSTEM] Generated 60-second OTP for ${cleanEmail}: ${otp}`);

    // Send OTP via Email using Nodemailer
    await sendOtpEmail(cleanEmail, otp);

    return {
      message: `OTP sent to ${cleanEmail}. Valid for 60 seconds.`,
      otp,
      expiresInSeconds: 60,
    };
  }

  async cancelOtp(email: string) {
    const cleanEmail = email.toLowerCase();
    await OtpModel.deleteMany({ email: cleanEmail });
    return { message: 'OTP invalidated successfully' };
  }

  async verifyOtp(email: string, otp: string, name?: string, phone?: string, password?: string) {
    const cleanEmail = email.toLowerCase();
    const otpRecord = await OtpModel.findOne({ email: cleanEmail, otp });

    if (!otpRecord) {
      throw ApiError.badRequest('Invalid or expired OTP. Please request a new 60-second code.');
    }

    await OtpModel.deleteMany({ email: cleanEmail });

    let user = await this.userRepo.findByEmail(cleanEmail);
    const isSuperAdminEmail = cleanEmail === 'swalimohd048@gmail.com';
    const assignedRole: UserRole = 'admin';

    if (!user) {
      const hashedPassword = password
        ? await bcrypt.hash(password, 10)
        : await bcrypt.hash(`otp_${Date.now()}_${Math.random()}`, 10);
      const initialStatus = isSuperAdminEmail ? 'active' : 'pending';

      user = await this.userRepo.create({
        name: name || (isSuperAdminEmail ? 'Super Admin' : 'Admin User'),
        email: cleanEmail,
        phone,
        passwordHash: hashedPassword,
        role: assignedRole,
        status: initialStatus,
        isSuperAdmin: isSuperAdminEmail,
      });

      if (!isSuperAdminEmail) {
        // Dispatch email alert to Super Admin
        sendAdminRequestNotification('swalimohd048@gmail.com', user.name, user.email, user.phone).catch(() => {});
      }
    } else {
      if (isSuperAdminEmail) {
        user.isSuperAdmin = true;
        user.status = 'active';
        user.role = 'admin';
      }

      if (user.status === 'pending') {
        throw ApiError.forbidden('Your registration request is pending Super Admin approval.');
      }
      if (user.status === 'rejected') {
        throw ApiError.forbidden('Your registration request was declined by the Super Admin.');
      }
      if (user.status === 'blocked') {
        throw ApiError.forbidden('Your account has been blocked');
      }

      if (password) user.passwordHash = await bcrypt.hash(password, 10);
      if (name) user.name = name;
      if (phone) user.phone = phone;
      await user.save();
    }

    const tokens = this.generateTokens(user._id.toString(), user.email, user.role);
    return {
      user: this.sanitizeUser(user),
      tokens,
      requiresApproval: user.status === 'pending',
    };
  }
}
