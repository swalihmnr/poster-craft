import { Schema, model, Document, Types } from 'mongoose';

export interface IAsset extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  type: 'psd' | 'frame' | 'photo' | 'logo' | 'background';
  provider: 'cloudinary' | 'local';
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  createdAt: Date;
}

const assetSchema = new Schema<IAsset>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['psd', 'frame', 'photo', 'logo', 'background'], default: 'photo' },
    provider: { type: String, enum: ['cloudinary', 'local'], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
    size: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AssetModel = model<IAsset>('Asset', assetSchema);
