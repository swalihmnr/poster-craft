import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, UserStatus } from '../../types/index.js';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  status: UserStatus;
  isSuperAdmin?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String },
    status: { type: String, enum: ['active', 'pending', 'rejected', 'blocked'], default: 'active' },
    isSuperAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>('User', userSchema);
