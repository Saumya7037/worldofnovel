export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string | null
}

export interface TipTapNode {
  type?: string
  text?: string
  content?: TipTapNode[]
  [key: string]: unknown
}

export interface TipTapDoc {
  type: 'doc'
  content?: TipTapNode[]
  [key: string]: unknown
}

export interface ChapterSummary {
  id: string
  title: string
  wordCount: number
  chapterOrder: number
  createdAt: string
  updatedAt: string
}

export interface Chapter extends ChapterSummary {
  novelId: string
  content: TipTapDoc | null
}

export interface FrontMatter {
  id: string
  content: TipTapDoc
  updatedAt: string
}

export interface NovelListItem {
  id: string
  title: string
  description: string
  authorName: string | null
  genre: string
  coverImageUrl: string | null
  lastOpenedChapterId: string | null
  lastOpenedAt: string | null
  createdAt: string
  updatedAt: string
  chapterCount: number
  wordCount: number
  lastChapterTitle: string | null
}

export interface NovelDetail {
  id: string
  title: string
  description: string
  authorName: string | null
  genre: string
  coverImageUrl: string | null
  lastOpenedChapterId: string | null
  lastOpenedAt: string | null
  createdAt: string
  updatedAt: string
  chapters: ChapterSummary[]
  frontMatter: FrontMatter | null
}