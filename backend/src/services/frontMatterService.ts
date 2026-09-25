import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { emptyDocument, normalizeDocument } from '../lib/document.js';
import { findOwnedNovel } from './novelService.js';

export async function getFrontMatter(novelId: string, userId: string) {
  const novel = await findOwnedNovel(novelId, userId);
  const frontMatter = await prisma.frontMatter.upsert({
    where: { novelId },
    update: {},
    create: { novelId, content: emptyDocument() as unknown as Prisma.InputJsonValue },
  });
  return { id: frontMatter.id, content: frontMatter.content, updatedAt: frontMatter.updatedAt };
}

export async function updateFrontMatter(novelId: string, userId: string, content: unknown) {
  await findOwnedNovel(novelId, userId);
  const normalized = normalizeDocument(content);
  const frontMatter = await prisma.frontMatter.upsert({
    where: { novelId },
    update: { content: normalized as unknown as Prisma.InputJsonValue },
    create: { novelId, content: normalized as unknown as Prisma.InputJsonValue },
  });
  await prisma.novel.update({
    where: { id: novelId },
    data: { updatedAt: new Date() },
  });
  return { id: frontMatter.id, content: frontMatter.content, updatedAt: frontMatter.updatedAt };
}