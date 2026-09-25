import { Router } from 'express';
import multer from 'multer';
import { uploadsAbsolutePath } from '../config/env.js';
import { requireAuth, type AuthedUser } from '../middleware/auth.js';
import { HttpError, badRequest } from '../lib/httpError.js';
import { prisma } from '../lib/prisma.js';
import { LocalStorageProvider } from '../services/storage/local.js';

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const storage = new LocalStorageProvider(uploadsAbsolutePath);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(
        new HttpError(
          400,
          'Only JPEG, PNG, WebP, or GIF images are allowed.',
        ),
      );
      return;
    }
    cb(null, true);
  },
});

export const uploadsRouter = Router();

uploadsRouter.use(requireAuth);

uploadsRouter.post('/cover', upload.single('file'), async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    if (!req.file) {
      throw badRequest('A file is required.');
    }
    const saved = await storage.save({
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
    });
    await prisma.image.create({
      data: {
        userId: user.id,
        fileName: req.file.originalname,
        filePath: saved.filePath,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      },
    });
    res.status(201).json({ url: saved.url });
  } catch (err) {
    next(err);
  }
});

uploadsRouter.post('/image', upload.single('file'), async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    if (!req.file) {
      throw badRequest('A file is required.');
    }

    let novelId: string | null = null;
    let chapterId: string | null = null;
    if (typeof req.body.novelId === 'string' && req.body.novelId) {
      const novel = await prisma.novel.findFirst({
        where: { id: req.body.novelId, userId: user.id },
      });
      if (!novel) {
        throw new HttpError(403, 'You do not have access to this novel.');
      }
      novelId = novel.id;
    }
    if (typeof req.body.chapterId === 'string' && req.body.chapterId) {
      const chapter = await prisma.chapter.findFirst({
        where: { id: req.body.chapterId, novel: { userId: user.id } },
      });
      if (!chapter) {
        throw new HttpError(403, 'You do not have access to this chapter.');
      }
      chapterId = chapter.id;
    }

    const saved = await storage.save({
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
    });
    await prisma.image.create({
      data: {
        userId: user.id,
        novelId,
        chapterId,
        fileName: req.file.originalname,
        filePath: saved.filePath,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      },
    });
    res.status(201).json({ url: saved.url });
  } catch (err) {
    next(err);
  }
});