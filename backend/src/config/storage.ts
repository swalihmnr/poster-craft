import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId: string;
  provider: 'cloudinary' | 'local';
  width?: number;
  height?: number;
  format?: string;
  size?: number;
}

export interface StorageService {
  uploadFile(filePath: string, folder?: string): Promise<UploadResult>;
  uploadBuffer(buffer: Buffer, originalname: string, folder?: string): Promise<UploadResult>;
  deleteFile(publicId: string): Promise<boolean>;
  getUploadSignature?(folder?: string): { signature: string; timestamp: number; apiKey: string; cloudName: string };
}

class CloudinaryStorage implements StorageService {
  async uploadFile(filePath: string, folder = 'poster_saas'): Promise<UploadResult> {
    const res = await cloudinary.uploader.upload(filePath, { folder });
    return {
      url: res.secure_url,
      publicId: res.public_id,
      provider: 'cloudinary',
      width: res.width,
      height: res.height,
      format: res.format,
      size: res.bytes,
    };
  }

  async uploadBuffer(buffer: Buffer, originalname: string, folder = 'poster_saas'): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            provider: 'cloudinary',
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.bytes,
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  async deleteFile(publicId: string): Promise<boolean> {
    const res = await cloudinary.uploader.destroy(publicId);
    return res.result === 'ok';
  }

  getUploadSignature(folder = 'poster_saas') {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      env.CLOUDINARY_API_SECRET
    );
    return {
      signature,
      timestamp,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
    };
  }
}

class LocalStorage implements StorageService {
  private uploadDir: string;

  constructor() {
    // Store the intended path but do NOT create directories at construction time.
    // Vercel's serverless environment has a read-only filesystem at module load.
    // Directories are created lazily inside each upload method (local dev only).
    this.uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  }

  private ensureDir(folder: string): void {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  async uploadFile(filePath: string, folder = 'assets'): Promise<UploadResult> {
    const targetFolder = path.join(this.uploadDir, folder);
    this.ensureDir(targetFolder);
    const filename = `${Date.now()}-${path.basename(filePath)}`;
    const destination = path.join(targetFolder, filename);
    await fs.promises.copyFile(filePath, destination);
    const stats = await fs.promises.stat(destination);

    const relativePath = path.relative(path.resolve(process.cwd()), destination);
    const url = `/uploads/${folder}/${filename}`;

    return {
      url,
      publicId: relativePath,
      provider: 'local',
      size: stats.size,
      format: path.extname(filename).replace('.', ''),
    };
  }

  async uploadBuffer(buffer: Buffer, originalname: string, folder = 'assets'): Promise<UploadResult> {
    const targetFolder = path.join(this.uploadDir, folder);
    this.ensureDir(targetFolder);
    const ext = path.extname(originalname) || '.png';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const destination = path.join(targetFolder, filename);

    await fs.promises.writeFile(destination, buffer);
    const stats = await fs.promises.stat(destination);

    const url = `/uploads/${folder}/${filename}`;

    return {
      url,
      publicId: `uploads/${folder}/${filename}`,
      provider: 'local',
      size: stats.size,
      format: ext.replace('.', ''),
    };
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const fullPath = path.resolve(process.cwd(), publicId);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
      return true;
    } catch (err) {
      logger.error({ err }, `Error deleting local file ${publicId}`);
      return false;
    }
  }
}

// Select active storage provider based on environment variables
export const storageService: StorageService =
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    ? new CloudinaryStorage()
    : new LocalStorage();
