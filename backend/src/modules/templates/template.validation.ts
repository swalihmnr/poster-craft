import { z } from 'zod';

const layerCropSchema = z.object({
  shape: z.enum(['rect', 'circle', 'rounded-rect']).default('rect'),
  borderRadius: z.number().optional(),
  aspectRatio: z.number().optional(),
  zoom: z.number().optional(),
  offsetX: z.number().optional(),
  offsetY: z.number().optional(),
}).passthrough();

const layerStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.string().optional(),
  fontStyle: z.string().optional(),
  color: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  verticalAlign: z.enum(['top', 'middle', 'bottom']).optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  opacity: z.number().optional(),
  shadowColor: z.string().optional(),
  shadowBlur: z.number().optional(),
  shadowOffsetX: z.number().optional(),
  shadowOffsetY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
}).passthrough();

export const layerSchema = z.object({
  _id: z.string().optional(),
  id: z.string(),
  name: z.string(),
  type: z.enum(['image', 'text']),
  source: z.string(),
  staticUrl: z.string().optional(),
  staticText: z.string().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  zIndex: z.number(),
  locked: z.boolean().optional(),
  visible: z.boolean().optional(),
  crop: layerCropSchema.optional(),
  style: layerStyleSchema.optional(),
}).passthrough();

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    description: z.string().optional(),
    width: z.number().positive().default(1080),
    height: z.number().positive().default(1350),
    background: z.object({
      type: z.enum(['color', 'image']),
      value: z.string(),
    }),
    layers: z.array(layerSchema).default([]),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
  }).passthrough(),
});

export const updateTemplateSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: createTemplateSchema.shape.body.partial().passthrough(),
});
