import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function intFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: intFromEnv(process.env.PORT, 4000),
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://postgres:toor@localhost:5432/worldofnovel',
  jwtSecret:
    process.env.JWT_SECRET ?? 'dev-secret-not-for-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/api/auth/google/callback',
  uploadDirectory: process.env.UPLOAD_DIRECTORY ?? 'uploads',
};

export const uploadsAbsolutePath = path.resolve(__dirname, '..', '..', env.uploadDirectory);

export const isGoogleConfigured =
  Boolean(env.googleClientId) && Boolean(env.googleClientSecret);