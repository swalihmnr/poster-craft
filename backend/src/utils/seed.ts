import bcrypt from 'bcryptjs';
import { UserModel } from '../modules/users/user.model.js';
import { logger } from './logger.js';
import { env } from '../config/env.js';

export async function seedDatabase() {
  const adminEmail = env.SUPER_ADMIN_EMAIL;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminPassword) {
    logger.warn('⚠️  SUPER_ADMIN_PASSWORD is not set — skipping admin seed. Set it in .env to create the admin account.');
    return;
  }

  try {
    const salt = await bcrypt.genSalt(11);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    let adminUser = await UserModel.findOne({ email: adminEmail });

    if (!adminUser) {
      adminUser = await UserModel.create({
        name: 'PosterCraft Admin',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        status: 'active',
        isSuperAdmin: true,
      });
      logger.info(`🔑 Created Super Admin account: ${adminEmail}`);
    } else {
      adminUser.role = 'admin';
      adminUser.status = 'active';
      adminUser.passwordHash = passwordHash;
      adminUser.isSuperAdmin = true;
      if (adminUser.name === 'Super Admin') {
        adminUser.name = 'PosterCraft Admin';
      }
      await adminUser.save();
      logger.info(`🔑 Updated & Verified Super Admin account: ${adminEmail}`);
    }
  } catch (err) {
    logger.error({ err }, 'Error seeding database');
  }
}
