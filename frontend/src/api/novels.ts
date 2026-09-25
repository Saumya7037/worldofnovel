import { fetchJson, uploadFile } from './client'
import type {
  Chapter,
  ChapterSummary,
  FrontMatter,
  NovelDetail,
  NovelListItem,
  TipTapDoc,
} from '../lib/types'

export const novelsApi = {
  list: () => fetchJson<{ novels: NovelListItem[] }>('/novels'),
  create: (input: {
    title: string
    description?: string
    authorName?: string | null
    genre?: string
    coverImageUrl?: string | null
    frontMatterContent?: TipTapDoc
  }) =>
    fetchJson<{ novel: NovelDetail }>('/novels', {
      method: 'POST',
      body: input,
    }),
  get: (id: string) => fetchJson<{ novel: NovelDetail }>(`/novels/${id}`),
  update: (
    id: string,
    input: {
      title?: string
      description?: string
      authorName?: string | null
      genre?: string
      coverImageUrl?: string | null
    },
  ) => fetchJson<{ novel: NovelDetail }>(`/novels/${id}`, { method: 'PUT', body: input }),
  remove: (id: string) => fetchJson<{ ok: boolean }>(`/novels/${id}`, { method: 'DELETE' }),
  setProgress: (id: string, chapterId: string | null) =>
    fetchJson<{ ok: boolean }>(`/novels/${id}/progress`, {
      method: 'PUT',
      body: { chapterId },
    }),
  reorder: (id: string, orderedIds: string[]) =>
    fetchJson<{ chapters: ChapterSummary[] }>(`/novels/${id}/reorder`, {
      method: 'POST',
      body: { orderedIds },
    }),
  listChapters: (id: string) =>
    fetchJson<{ chapters: Chapter[] }>(`/novels/${id}/chapters`),
  createChapter: (id: string, input: { title: string; content?: TipTapDoc }) =>
    fetchJson<{ chapter: Chapter }>(`/novels/${id}/chapters`, {
      method: 'POST',
      body: input,
    }),
  getFrontMatter: (id: string) =>
    fetchJson<{ frontMatter: FrontMatter }>(`/novels/${id}/front-matter`),
  updateFrontMatter: (id: string, content: TipTapDoc) =>
    fetchJson<{ frontMatter: FrontMatter }>(`/novels/${id}/front-matter`, {
      method: 'PUT',
      body: { content },
    }),
}

export const chaptersApi = {
  update: (id: string, input: { title?: string; content?: TipTapDoc }) =>
    fetchJson<{ chapter: Chapter }>(`/chapters/${id}`, { method: 'PUT', body: input }),
  remove: (id: string) => fetchJson<{ ok: boolean }>(`/chapters/${id}`, { method: 'DELETE' }),
}

export const uploadsApi = {
  cover: (file: File) => uploadFile('/uploads/cover', file),
  image: (file: File, context: { novelId?: string; chapterId?: string } = {}) =>
    uploadFile('/uploads/image', file, {
      ...(context.novelId ? { novelId: context.novelId } : {}),
      ...(context.chapterId ? { chapterId: context.chapterId } : {}),
    }),
}