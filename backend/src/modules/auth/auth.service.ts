import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../users/user.repository.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/apiError.js';
import { IUserPayload, UserRole } from '../../types/index.js';

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
      role: user.role,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
