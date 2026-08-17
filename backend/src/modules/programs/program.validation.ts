import { z } from 'zod';

export const createProgramSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Program name is required'),
    slug: z.string().min(2).optional(),
    description: z.string().optional(),
    thumbnail: z.string().optional(),
    templateId: z.string().min(1, 'Template ID is required'),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
  }),
});

export const updateProgramSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: createProgramSchema.shape.body.partial(),
});

export const updateProgramStatusSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.enum(['draft', 'published', 'archived']),
  }),
});
