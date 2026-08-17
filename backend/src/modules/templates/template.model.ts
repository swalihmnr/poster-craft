import { Schema, model, Document, Types } from 'mongoose';
import { ITemplateLayer } from '../../types/index.js';

export interface ITemplate extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  width: number;
  height: number;
  background: {
    type: 'color' | 'image';
    value: string;
  };
  layers: ITemplateLayer[];
  version: number;
  status: 'draft' | 'published' | 'archived';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const layerSchema = new Schema<ITemplateLayer>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['image', 'text'], required: true },
    source: { type: String, required: true },
    staticUrl: { type: String },
    staticText: { type: String },
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    width: { type: Number, required: true, default: 200 },
    height: { type: Number, required: true, default: 200 },
    rotation: { type: Number, default: 0 },
    zIndex: { type: Number, required: true, default: 1 },
    locked: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    crop: {
      shape: { type: String, enum: ['rect', 'circle', 'rounded-rect'], default: 'rect' },
      borderRadius: { type: Number, default: 0 },
      aspectRatio: { type: Number },
      zoom: { type: Number, default: 1 },
      offsetX: { type: Number, default: 0 },
      offsetY: { type: Number, default: 0 },
    },
    style: {
      fontFamily: { type: String, default: 'Inter' },
      fontSize: { type: Number, default: 48 },
      fontWeight: { type: String, default: 'bold' },
      fontStyle: { type: String, default: 'normal' },
      color: { type: String, default: '#000000' },
      textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
      verticalAlign: { type: String, enum: ['top', 'middle', 'bottom'], default: 'middle' },
      lineHeight: { type: Number, default: 1.2 },
      letterSpacing: { type: Number, default: 0 },
      textTransform: { type: String, enum: ['none', 'uppercase', 'lowercase', 'capitalize'], default: 'none' },
      opacity: { type: Number, default: 1 },
      shadowColor: { type: String },
      shadowBlur: { type: Number, default: 0 },
      shadowOffsetX: { type: Number, default: 0 },
      shadowOffsetY: { type: Number, default: 0 },
      backgroundColor: { type: String },
      borderRadius: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const templateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    width: { type: Number, required: true, default: 1080 },
    height: { type: Number, required: true, default: 1350 },
    background: {
      type: { type: String, enum: ['color', 'image'], default: 'color' },
      value: { type: String, default: '#ffffff' },
    },
    layers: [layerSchema],
    version: { type: Number, default: 1 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const TemplateModel = model<ITemplate>('Template', templateSchema);
