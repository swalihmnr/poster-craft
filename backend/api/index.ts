import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/app.js';
import { connectDB } from '../src/config/database.js';

// connectDB is safe to call on every cold start — it guards with readyState check.
// seedDatabase is NOT called here: seeding runs once during local dev (server.ts).
// On production, run seed manually or via a one-off script.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await connectDB();
  return app(req, res);
}
