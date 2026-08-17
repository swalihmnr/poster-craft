import { app } from '../src/app.js';
import { connectDB } from '../src/config/database.js';
import { seedDatabase } from '../src/utils/seed.js';

export default async function handler(req: any, res: any) {
  await connectDB();
  await seedDatabase();
  return app(req, res);
}
