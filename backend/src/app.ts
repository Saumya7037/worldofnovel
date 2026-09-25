import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env, uploadsAbsolutePath } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { googleRouter } from './routes/google.js';
import { uploadsRouter } from './routes/uploads.js';
import { novelsRouter } from './routes/novels.js';
import { chaptersRouter } from './routes/chapters.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { isGoogleConfigured } from './config/env.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, googleConfigured: isGoogleConfigured });
  });

  app.use('/uploads', express.static(uploadsAbsolutePath, { fallthrough: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/auth/google', googleRouter);
  app.use('/api/uploads', uploadsRouter);
  app.use('/api/novels', novelsRouter);
  app.use('/api/chapters', chaptersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}