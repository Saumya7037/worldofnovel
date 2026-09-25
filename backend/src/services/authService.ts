import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { badRequest, unauthorized } from '../lib/httpError.js';

const BCRYPT_ROUNDS = 10;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw badRequest('Email is already registered.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  return prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
    },
  });
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<User> {
  const email = input.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  const passwordMatches =
    user?.passwordHash != null
      ? await bcrypt.compare(input.password, user.passwordHash)
      : false;

  if (!user || !passwordMatches) {
    throw unauthorized('Incorrect email or password.');
  }
  return user;
}