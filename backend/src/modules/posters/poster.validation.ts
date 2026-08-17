import { z } from 'zod';

export const createPosterSchema = z.object({
  body: z.object({
    programId: z.string().min(1, 'Program ID is required'),
    templateId: z.string().min(1, 'Template ID is required'),
    input: z.object({
      name: z.string().min(1, 'User name is required'),
      photoUrl: z.string().optional(),
      crop: z.object({}).passthrough().optional(),
      customFields: z.record(z.string(), z.string()).optional(),
    }),
    format: z.enum(['png', 'webp']).default('png'),
  }),
});
