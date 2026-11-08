import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/database.js';

// connectDB is safe to call on every cold start — it guards with readyState check.
// seedDatabase is NOT called here: seeding runs once during local dev (server.ts).
// On production, run seed manually or via a one-off script.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow health check to succeed even before DB connects
  if (req.url === '/health' || req.url === '/api/health') {
    return app(req, res);
  }

  try {
    await connectDB();
  } catch (err: any) {
    console.error('Database connection failed in serverless handler:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DB_CONNECTION_ERROR',
        message: `Database connection error: ${err.message || 'Failed to connect to MongoDB'}. In MongoDB Atlas -> Network Access, add IP Address 0.0.0.0/0 (Allow Access from Anywhere).`,
      },
    });
  }
  return app(req, res);
}
