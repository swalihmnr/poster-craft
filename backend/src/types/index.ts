import { Request } from 'express';

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'blocked';

export interface IUserPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: IUserPayload;
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
}

export interface LayerCrop {
  shape: CropShape;
  borderRadius?: number;
  aspectRatio?: number;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface ITemplateLayer {
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
