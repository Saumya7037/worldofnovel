import { Router } from 'express';
import crypto from 'node:crypto';
import { env, isGoogleConfigured } from '../config/env.js';
import { HttpError } from '../lib/httpError.js';
import { signJwtCookie } from '../middleware/auth.js';
import { signToken } from '../lib/jwt.js';
import { buildGoogleAuthUrl, exchangeCodeForUser, upsertGoogleUser } from '../services/googleService.js';
import { toPublicUser } from '../services/authService.js';

export const googleRouter = Router();

function requireGoogleConfigured(): void {
  if (!isGoogleConfigured) {
    throw new HttpError(400, 'Google authentication is not configured on this server.');
  }
}

googleRouter.get('/', (_req, res) => {
  try {
    requireGoogleConfigured();
    const state = crypto.randomBytes(16).toString('hex');
    res.redirect(buildGoogleAuthUrl(state));
  } catch (err) {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

googleRouter.get('/callback', async (req, res, next) => {
  try {
    requireGoogleConfigured();
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    if (!code) {
      throw new HttpError(400, 'Google authentication failed.');
    }

    const profile = await exchangeCodeForUser(code);
    const user = await upsertGoogleUser(profile);
    const token = signToken({ sub: user.id, email: user.email, name: user.name });
    signJwtCookie(res, token);
    res.redirect(`${env.frontendUrl}/dashboard`);
  } catch (err) {
    next(err);
  }
});