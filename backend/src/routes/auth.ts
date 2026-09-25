import { Router } from 'express';
import { registerSchema, loginSchema } from '../schemas/authSchemas.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, signJwtCookie, clearJwtCookie, type AuthedUser } from '../middleware/auth.js';
import { registerUser, loginUser, toPublicUser } from '../services/authService.js';
import { signToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    const token = signToken({ sub: user.id, email: user.email, name: user.name });
    signJwtCookie(res, token);
    res.status(201).json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const user = await loginUser(req.body);
    const token = signToken({ sub: user.id, email: user.email, name: user.name });
    signJwtCookie(res, token);
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (_req, res) => {
  clearJwtCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = req.user as AuthedUser;
    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fresh) {
      clearJwtCookie(res);
      res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
      return;
    }
    res.json({ user: toPublicUser(fresh) });
  } catch (err) {
    next(err);
  }
});