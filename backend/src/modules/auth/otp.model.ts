import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  createdAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60, // TTL Index: MongoDB automatically deletes document after 60 seconds (1 minute)
    },
  },
  {
    timestamps: false,
  }
);

export const OtpModel = mongoose.model<IOtp>('Otp', otpSchema);
