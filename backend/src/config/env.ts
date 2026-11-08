import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  MONGO_URI: z
    .string()
    .default(
      'mongodb+srv://swalimohd048_db_user:JgXYJPzeBenysDqg@cluster0.prlbswa.mongodb.net/poster_creator?retryWrites=true&w=majority'
    ),

  // JWT secrets — safe fallbacks prevent serverless crashes if omitted on Vercel
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
    .default('7f3c9a2e8d1b4f6a0c5e9d7b3a8f2c6e1d4b7a9f5c2e8d0a6b3f1c9e7d5a2'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters')
    .default('8cf9760f1ed03b6edb1f382747c8f4e9e1bdd26fa4c20b5b878624506bbda0254bc4508c11f151e4620f022edb1e903b'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  CLIENT_URL: z.string().default('https://poster-craft-phi.vercel.app'),
  UPLOAD_DIR: z.string().default('uploads'),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587').transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().default('PosterCraft <noreply@postercraft.com>'),

  // Super admin identity
  SUPER_ADMIN_EMAIL: z.string().email('SUPER_ADMIN_EMAIL must be a valid email').default('swalimohd048@gmail.com'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables, using defaults:', parsed.error.flatten().fieldErrors);
}

export const env = parsed.success ? parsed.data : (envSchema.parse({}) as z.infer<typeof envSchema>);
