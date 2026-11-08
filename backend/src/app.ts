import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { env } from './config/env.js';
import { connectDB } from './config/database.js';
import { logger } from './utils/logger.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routers
import authRoutes from './modules/auth/auth.routes.js';
import programRoutes from './modules/programs/program.routes.js';
import templateRoutes from './modules/templates/template.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import posterRoutes from './modules/posters/poster.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import userRoutes from './modules/users/user.routes.js';

export const app = express();

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = new Set(
  [
    env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://poster-craft-phi.vercel.app',
  ].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, allowedOrigins, or any .vercel.app deployment
      if (!origin || allowedOrigins.has(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  })
);

app.use(globalRateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static uploaded files with CORS headers (for local storage provider)
const uploadDirPath = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDirPath)) {
  fs.mkdirSync(uploadDirPath, { recursive: true });
}
app.use(
  '/uploads',
  express.static(uploadDirPath, {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Ensure DB connection for API routes
app.use(async (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (err: any) {
    logger.error({ err }, 'Database connection error in middleware');
    return res.status(500).json({
      success: false,
      error: {
        code: 'DB_CONNECTION_ERROR',
        message: `Database connection error: ${err.message || 'Failed to connect to MongoDB'}. In MongoDB Atlas -> Network Access, add IP Address 0.0.0.0/0 (Allow Access from Anywhere).`,
      },
    });
  }
});

// API Routes
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(API_PREFIX, programRoutes);
app.use(API_PREFIX, templateRoutes);
app.use(`${API_PREFIX}/assets`, assetRoutes);
app.use(`${API_PREFIX}/posters`, posterRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);

// Fallback 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// Global error handler
app.use(errorHandler);
