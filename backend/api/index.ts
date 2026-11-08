import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/database.js';

// connectDB is safe to call on every cold start — it guards with readyState check.
// seedDatabase is NOT called here: seeding runs once during local dev (server.ts).
// On production, run seed manually or via a one-off script.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectDB();
  } catch (err: any) {
    console.error('Database connection failed in serverless handler:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DB_CONNECTION_ERROR',
        message: `Database connection error: ${err.message || 'Failed to connect to MongoDB'}. Please verify MONGO_URI in Vercel and check that MongoDB Atlas allows access from all IPs (0.0.0.0/0).`,
      },
    });
  }
  return app(req, res);
}
