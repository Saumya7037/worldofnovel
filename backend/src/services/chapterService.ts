import type { Chapter, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import { countWords, normalizeDocument } from '../lib/document.js';
import { findOwnedNovel } from './novelService.js';

export interface ChapterDetail extends Chapter {}

export async function getOwnedChapter(chapterId: string, userId: string): Promise<Chapter> {
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, novel: { userId } },
  });
  if (!chapter) {
    throw new HttpError(404, 'Chapter not found.');
  }
  return chapter;
}

export async function listChapters(novelId: string, userId: string): Promise<ChapterDetail[]> {
  await findOwnedNovel(novelId, userId);
  return prisma.chapter.findMany({
    where: { novelId },
    orderBy: { chapterOrder: 'asc' },
  });
}

export async function createChapter(
  novelId: string,
  userId: string,
  data: { title: string; content: unknown },
): Promise<ChapterDetail> {
  await findOwnedNovel(novelId, userId);
  const maxOrder = await prisma.chapter.aggregate({
    where: { novelId },
    _max: { chapterOrder: true },
  });
  const content = normalizeDocument(data.content);
  return prisma.chapter.create({
    data: {
      novelId,
      title: data.title,
      content: content as unknown as Prisma.InputJsonValue,
      wordCount: countWords(content),
      chapterOrder: (maxOrder._max.chapterOrder ?? -1) + 1,
    },
  });
}

export async function updateChapter(
  chapterId: string,
  userId: string,
  data: { title?: string; content?: unknown },
): Promise<ChapterDetail> {
  const chapter = await getOwnedChapter(chapterId, userId);
  const update: { title?: string; content?: Prisma.InputJsonValue; wordCount?: number } = {};

  if (data.title !== undefined) {
    update.title = data.title;
  }
  if (data.content !== undefined) {
    const content = normalizeDocument(data.content);
    update.content = content as unknown as Prisma.InputJsonValue;
    update.wordCount = countWords(content);
  }

  const updated = await prisma.chapter.update({
    where: { id: chapter.id },
    data: update,
  });
  // Keep the novel's "last edited" timestamp fresh.
  await prisma.novel.update({
    where: { id: chapter.novelId },
    data: { updatedAt: new Date() },
  });
  return updated;
}

export async function deleteChapter(chapterId: string, userId: string): Promise<void> {
  const chapter = await getOwnedChapter(chapterId, userId);
  await prisma.chapter.delete({ where: { id: chapter.id } });

  const novel = await prisma.novel.findUnique({ where: { id: chapter.novelId } });
  if (novel != null && novel.lastOpenedChapterId === chapter.id) {
    await prisma.novel.update({
      where: { id: novel.id },
      data: { lastOpenedChapterId: null },
    });
  }
}

export async function reorderChapters(
  novelId: string,
  userId: string,
  orderedIds: string[],
): Promise<ChapterDetail[]> {
  await findOwnedNovel(novelId, userId);
  const existing = await prisma.chapter.findMany({ where: { novelId } });
  const existingIds = new Set(existing.map((c) => c.id));

  if (orderedIds.length !== existingIds.size || orderedIds.some((id) => !existingIds.has(id))) {
    throw new HttpError(400, 'The chapter list does not match this novel.');
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.chapter.update({
        where: { id },
        data: { chapterOrder: index },
      }),
    ),
  );

  return prisma.chapter.findMany({
    where: { novelId },
    orderBy: { chapterOrder: 'asc' },
  });
}