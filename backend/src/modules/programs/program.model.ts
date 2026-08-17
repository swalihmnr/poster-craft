import { Schema, model, Document, Types } from 'mongoose';

export interface IProgram extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  templateId: Types.ObjectId;
  status: 'draft' | 'published' | 'archived';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const programSchema = new Schema<IProgram>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    thumbnail: { type: String },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ProgramModel = model<IProgram>('Program', programSchema);
