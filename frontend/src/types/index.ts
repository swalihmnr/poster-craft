export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'blocked';
  createdAt?: string;
}

export type LayerType = 'image' | 'text';
export type ImageSourceType = 'static' | 'user-photo';
export type TextSourceType = 'static' | 'user.name' | string;
export type CropShape = 'rect' | 'circle' | 'rounded-rect';

export interface LayerStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '500' | '600' | '700' | '800';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  opacity?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  backgroundColor?: string;
  borderRadius?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

export interface LayerCrop {
  shape: CropShape;
  borderRadius?: number;
  aspectRatio?: number;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

export interface TemplateLayer {
  id: string;
  name: string;
  type: LayerType;
  source: ImageSourceType | TextSourceType;
  staticUrl?: string;
  staticText?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  crop?: LayerCrop;
  style?: LayerStyle;
}

export interface TemplateConfig {
  _id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  background: {
    type: 'color' | 'image';
    value: string;
  };
  layers: TemplateLayer[];
  version: number;
  status: 'draft' | 'published' | 'archived';
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  templateId: TemplateConfig;
  status: 'draft' | 'published' | 'archived';
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCropInput {
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

export interface UserPosterInput {
  name: string;
  photoUrl?: string;
  photos?: Record<string, string>;
  crop?: UserCropInput;
  crops?: Record<string, UserCropInput>;
  customFields?: Record<string, string>;
}

export interface Asset {
  _id: string;
  ownerId: string;
  type: 'psd' | 'frame' | 'photo' | 'logo' | 'background';
  provider: 'cloudinary' | 'local';
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  createdAt?: string;
}

export interface PosterGeneration {
  id: string;
  program: Program;
  template: TemplateConfig;
  input: UserPosterInput;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}
