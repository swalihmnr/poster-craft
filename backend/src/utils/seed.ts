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

    const templateCount = await TemplateModel.countDocuments();
    if (templateCount === 0 && adminUser) {
      const template = await TemplateModel.create({
        name: 'Conference Speaker Poster',
        description: 'Modern vibrant speaker poster template for tech summits and conferences',
        width: 1080,
        height: 1350,
        background: {
          type: 'color',
          value: '#0f172a',
        },
        version: 1,
        status: 'published',
        createdBy: adminUser._id,
        layers: [
          {
            id: 'bg_decoration',
            name: 'Header Banner Text',
            type: 'text',
            source: 'static',
            staticText: 'GLOBAL TECH SUMMIT 2026',
            x: 90,
            y: 80,
            width: 900,
            height: 60,
            rotation: 0,
            zIndex: 1,
            style: {
              fontFamily: 'Inter',
              fontSize: 36,
              fontWeight: 'bold',
              color: '#38bdf8',
              textAlign: 'center',
              letterSpacing: 2,
            },
          },
          {
            id: 'speaker_photo',
            name: 'Speaker Photo Area',
            type: 'image',
            source: 'user-photo',
            x: 290,
            y: 190,
            width: 500,
            height: 500,
            rotation: 0,
            zIndex: 2,
            crop: {
              shape: 'circle',
              zoom: 1,
              offsetX: 0,
              offsetY: 0,
            },
          },
          {
            id: 'speaker_name',
            name: 'Speaker Name',
            type: 'text',
            source: 'user.name',
            x: 100,
            y: 740,
            width: 880,
            height: 90,
            rotation: 0,
            zIndex: 3,
            style: {
              fontFamily: 'Outfit',
              fontSize: 64,
              fontWeight: '800',
              color: '#ffffff',
              textAlign: 'center',
              shadowColor: 'rgba(0,0,0,0.5)',
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowOffsetY: 4,
            },
          },
          {
            id: 'speaker_tagline',
            name: 'Role Tagline',
            type: 'text',
            source: 'static',
            staticText: 'KEYNOTE SPEAKER',
            x: 240,
            y: 850,
            width: 600,
            height: 50,
            rotation: 0,
            zIndex: 4,
            style: {
              fontFamily: 'Inter',
              fontSize: 28,
              fontWeight: '600',
              color: '#fbbf24',
              textAlign: 'center',
            },
          },
          {
            id: 'event_footer',
            name: 'Event Details Footer',
            type: 'text',
            source: 'static',
            staticText: 'SEPTEMBER 24-26, 2026 • CONVENTION CENTER',
            x: 90,
            y: 1220,
            width: 900,
            height: 50,
            rotation: 0,
            zIndex: 5,
            style: {
              fontFamily: 'Inter',
              fontSize: 24,
              fontWeight: 'normal',
              color: '#94a3b8',
              textAlign: 'center',
            },
          },
        ],
      });

      await ProgramModel.create({
        name: 'Tech Summit 2026 Speaker Posters',
        slug: 'tech-summit-2026-speaker-posters',
        description: 'Generate your official Keynote & Speaker badge posters for Tech Summit 2026',
        thumbnail: '',
        templateId: template._id,
        status: 'published',
        createdBy: adminUser._id,
      });

      logger.info('🌟 Default starter Template and Program seeded successfully!');
    }
  } catch (err) {
    logger.error({ err }, 'Error seeding database');
  }
}
