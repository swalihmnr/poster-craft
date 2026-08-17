import { Schema, model, Document, Types } from 'mongoose';

export interface IPosterGeneration extends Document {
  _id: Types.ObjectId;
  programId: Types.ObjectId;
  templateId: Types.ObjectId;
  userId?: Types.ObjectId;
  input: {
    name: string;
    photoUrl?: string;
    crop?: object;
    customFields?: Record<string, string>;
  };
  output?: {
    imageUrl?: string;
    format: string;
    renderTimeMs?: number;
  };
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

const posterGenerationSchema = new Schema<IPosterGeneration>(
  {
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    input: {
      name: { type: String, required: true },
      photoUrl: { type: String },
      crop: { type: Object },
      customFields: { type: Map, of: String },
    },
    output: {
      imageUrl: { type: String },
      format: { type: String, default: 'png' },
      renderTimeMs: { type: Number },
    },
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'completed' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PosterGenerationModel = model<IPosterGeneration>('PosterGeneration', posterGenerationSchema);
