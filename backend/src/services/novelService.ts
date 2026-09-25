import type { Novel, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/httpError.js';
import { emptyDocument, countWords, normalizeDocument } from '../lib/document.js';

export interface NovelListItem {
  id: string;
  title: string;
  description: string;
  authorName: string | null;
  genre: string;
  coverImageUrl: string | null;
  lastOpenedChapterId: string | null;
  lastOpenedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  chapterCount: number;
  wordCount: number;
  lastChapterTitle: string | null;
}

export interface ChapterSummary {
  id: string;
  title: string;
  wordCount: number;
  chapterOrder: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface FrontMatterSummary {
  id: string;
  content: unknown;
  updatedAt: Date;
}

export interface NovelDetail {
  id: string;
  title: string;
  description: string;
  authorName: string | null;
  genre: string;
  coverImageUrl: string | null;
  lastOpenedChapterId: string | null;
  lastOpenedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  chapters: ChapterSummary[];
  frontMatter: FrontMatterSummary | null;
}

export async function findOwnedNovel(novelId: string, userId: string): Promise<Novel> {
  const novel = await prisma.novel.findFirst({
    where: { id: novelId, userId },
  });
  if (!novel) {
    throw new HttpError(404, 'Novel not found.');
  }
  return novel;
}

function toListItem(novel: Novel, chapters: ChapterSummary[]): NovelListItem {
  const lastChapter =
    novel.lastOpenedChapterId != null
      ? chapters.find((c) => c.id === novel.lastOpenedChapterId) ?? null
      : null;
  return {
    id: novel.id,
    title: novel.title,
    description: novel.description,
    authorName: novel.authorName,
    genre: novel.genre,
    coverImageUrl: novel.coverImageUrl,
    lastOpenedChapterId: novel.lastOpenedChapterId,
    lastOpenedAt: novel.lastOpenedAt,
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
    chapterCount: chapters.length,
    wordCount: chapters.reduce((sum, c) => sum + c.wordCount, 0),
    lastChapterTitle: lastChapter?.title ?? null,
  };
}

export async function listNovels(userId: string): Promise<NovelListItem[]> {
  const novels = await prisma.novel.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      chapters: {
        select: {
          id: true,
          title: true,
          wordCount: true,
          chapterOrder: true,
          updatedAt: true,
          createdAt: true,
        },
      },
    },
  });
  return novels.map((n) => toListItem(n, n.chapters));
}

export async function getNovelDetail(novelId: string, userId: string): Promise<NovelDetail> {
  const novel = await findOwnedNovel(novelId, userId);
  const chapters = await prisma.chapter.findMany({
    where: { novelId },
    orderBy: { chapterOrder: 'asc' },
    select: {
      id: true,
      title: true,
      wordCount: true,
      chapterOrder: true,
      updatedAt: true,
      createdAt: true,
    },
  });
  const frontMatter = await prisma.frontMatter.findUnique({ where: { novelId } });
  return {
    id: novel.id,
    title: novel.title,
    description: novel.description,
    authorName: novel.authorName,
    genre: novel.genre,
    coverImageUrl: novel.coverImageUrl,
    lastOpenedChapterId: novel.lastOpenedChapterId,
    lastOpenedAt: novel.lastOpenedAt,
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
    chapters,
    frontMatter: frontMatter
      ? { id: frontMatter.id, content: frontMatter.content, updatedAt: frontMatter.updatedAt }
      : null,
  };
}

export async function createNovel(
  userId: string,
  data: {
    title: string;
    description: string;
    authorName: string | null;
    genre: string;
    coverImageUrl: string | null;
    frontMatterContent?: unknown;
  },
): Promise<NovelDetail> {
  const novel = await prisma.novel.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      authorName: data.authorName,
      genre: data.genre,
      coverImageUrl: data.coverImageUrl,
    },
  });

  const content = data.frontMatterContent
    ? normalizeDocument(data.frontMatterContent)
    : emptyDocument();
  await prisma.frontMatter.create({
    data: {
      novelId: novel.id,
      content: content as unknown as Prisma.InputJsonValue,
    },
  });

  return getNovelDetail(novel.id, userId);
}

export async function updateNovel(
  novelId: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    authorName?: string | null;
    genre?: string;
    coverImageUrl?: string | null;
  },
): Promise<NovelDetail> {
  await findOwnedNovel(novelId, userId);
  const updated = await prisma.novel.update({
    where: { id: novelId },
    data,
  });
  return getNovelDetail(updated.id, userId);
}

export async function deleteNovel(novelId: string, userId: string): Promise<void> {
  await findOwnedNovel(novelId, userId);
  await prisma.novel.delete({ where: { id: novelId } });
}

export async function updateProgress(
  novelId: string,
  userId: string,
  chapterId: string | null,
): Promise<void> {
  await findOwnedNovel(novelId, userId);
  if (chapterId != null) {
    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId, novelId },
    });
    if (!chapter) {
      throw new HttpError(404, 'Chapter not found.');
    }
  }
  await prisma.novel.update({
    where: { id: novelId },
    data: {
      lastOpenedChapterId: chapterId,
      lastOpenedAt: new Date(),
    },
  });
}