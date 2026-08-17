import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routers
import authRoutes from './modules/auth/auth.routes.js';
import programRoutes from './modules/programs/program.routes.js';
import templateRoutes from './modules/templates/template.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import posterRoutes from './modules/posters/poster.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

export const app = express();

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and configured client URL
      if (!origin || origin.includes('localhost') || origin === env.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(globalRateLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static uploaded files for local storage provider fallback with CORS headers
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
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

// API Routes
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(API_PREFIX, programRoutes);
app.use(API_PREFIX, templateRoutes);
app.use(`${API_PREFIX}/assets`, assetRoutes);
app.use(`${API_PREFIX}/posters`, posterRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

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
