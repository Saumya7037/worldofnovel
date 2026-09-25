import { env } from '../config/env.js';
import { HttpError } from '../lib/httpError.js';
import { prisma } from '../lib/prisma.js';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const SCOPES = ['openid', 'email', 'profile'].join(' ');

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleCallbackUrl,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'online',
    prompt: 'select_account',
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForUser(code: string): Promise<{
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleCallbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    throw new HttpError(401, 'Google authentication failed.');
  }

  const tokens = (await tokenRes.json()) as { access_token: string };

  const userInfoRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userInfoRes.ok) {
    throw new HttpError(401, 'Google authentication failed.');
  }

  const info = (await userInfoRes.json()) as {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!info.sub || !info.email) {
    throw new HttpError(401, 'Google authentication failed.');
  }

  return {
    googleId: info.sub,
    email: info.email,
    name: info.name ?? info.email.split('@')[0],
    avatarUrl: info.picture ?? null,
  };
}

export async function upsertGoogleUser(profile: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}) {
  const existingByGoogle = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });
  if (existingByGoogle) {
    return existingByGoogle;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: profile.email.toLowerCase() },
  });
  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        googleId: profile.googleId,
        name: existingByEmail.name,
        avatarUrl: existingByEmail.avatarUrl ?? profile.avatarUrl,
      },
    });
  }

  return prisma.user.create({
    data: {
      name: profile.name,
      email: profile.email.toLowerCase(),
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
    },
  });
}