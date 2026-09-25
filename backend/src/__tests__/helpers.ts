import request from 'supertest';
import type { Response } from 'supertest';
import { createApp } from '../app.js';

export const app = createApp();
export const api = request(app);

export async function registerUser(
  overrides: { name?: string; email?: string; password?: string } = {},
): Promise<{ agent: ReturnType<typeof request.agent>; user: { id: string; name: string; email: string } }> {
  const email = overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const name = overrides.name ?? 'Test Writer';
  const password = overrides.password ?? 'correct-horse-1';

  const agent = request.agent(app);
  const res: Response = await agent.post('/api/auth/register').send({ name, email, password });
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    agent,
    user: {
      id: res.body.user.id as string,
      name: res.body.user.name as string,
      email: res.body.user.email as string,
    },
  };
}

export function randomEmail(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
}

export async function cleanupDatabase(): Promise<void> {
  const { prisma } = await import('../lib/prisma.js');
  await prisma.image.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.frontMatter.deleteMany();
  await prisma.novel.deleteMany();
  await prisma.user.deleteMany();
}