import bcrypt from 'bcryptjs';
import { UserModel } from '../modules/users/user.model.js';
import { TemplateModel } from '../modules/templates/template.model.js';
import { ProgramModel } from '../modules/programs/program.model.js';
import { logger } from './logger.js';

export async function seedDatabase() {
  try {
    let adminUser = await UserModel.findOne({ email: 'swalimohd048@gmail.com' });
    const salt = await bcrypt.genSalt(11);
    const passwordHash = await bcrypt.hash('@mmswalimnr3838', salt);

    if (!adminUser) {
      adminUser = await UserModel.create({
        name: 'PosterCraft Admin',
        email: 'swalimohd048@gmail.com',
        passwordHash,
        role: 'admin',
        status: 'active',
      });
      logger.info('🔑 Created Admin account: swalimohd048@gmail.com');
    } else {
      adminUser.role = 'admin';
      adminUser.status = 'active';
      adminUser.passwordHash = passwordHash;
      if (adminUser.name === 'Super Admin') {
        adminUser.name = 'PosterCraft Admin';
      }
      await adminUser.save();
      logger.info('🔑 Updated & Verified Admin account: swalimohd048@gmail.com');
    }
  } catch (err) {
    logger.error({ err }, 'Error seeding database');
  }
}
