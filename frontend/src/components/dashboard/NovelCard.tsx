import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, MoreVertical, PenLine, Play, Settings2, Trash2, Download } from 'lucide-react'
import type { NovelListItem } from '../../lib/types'
import { timeAgo } from '../../lib/utils'
import { cn } from '../../lib/utils'
import { novelsApi } from '../../api/novels'
import { downloadNovelAsDoc } from '../../lib/export'
import { useToast } from '../ui/Toast'

export function NovelCard({
  novel,
  onManage,
  onDelete,
}: {
  novel: NovelListItem
  onManage: (novel: NovelListItem) => void
  onDelete: (novel: NovelListItem) => void
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  function openWorkspace() {
    if (novel.lastOpenedChapterId) {
      navigate(`/novels/${novel.id}/chapters/${novel.lastOpenedChapterId}`)
    } else {
      navigate(`/novels/${novel.id}`)
    }
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line-soft bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-ember/40 hover:shadow-xl hover:shadow-black/5">
      <button
        onClick={openWorkspace}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-muted"
        aria-label={`Open ${novel.title}`}
      >
        {novel.coverImageUrl ? (
          <>
            <img
              src={novel.coverImageUrl}
              alt=""
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ember/10 via-muted to-elevated transition-colors group-hover:from-ember/20">
            <BookOpen className="size-10 text-ink-faint" />
          </div>
        )}
        {novel.genre && (
          <span className="absolute left-3 top-3 rounded-full bg-canvas/85 px-2.5 py-1 text-[11px] font-medium text-ink backdrop-blur">
            {novel.genre}
          </span>
        )}
        {novel.chapterCount > 0 && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            <PenLine className="size-3" /> {novel.chapterCount} chapters ·{' '}
            {novel.wordCount.toLocaleString()} words
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-lg font-semibold text-ink">{novel.title}</h3>
            {novel.authorName && (
              <p className="truncate text-xs text-ink-faint">by {novel.authorName}</p>
            )}
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-muted hover:text-ink"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Novel options"
            >
              <MoreVertical className="size-4.5" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-line-soft bg-surface shadow-xl animate-scale-in"
                role="menu"
              >
                <button
                  role="menuitem"
                  onClick={async () => {
                    setMenuOpen(false)
                    toast('success', 'Fetching novel for download...')
                    try {
                      const detail = await novelsApi.get(novel.id)
                      const res = await novelsApi.listChapters(novel.id)
                      downloadNovelAsDoc(detail.novel, res.chapters)
                      toast('success', 'Download complete.')
                    } catch (e) {
                      toast('error', 'Download failed.')
                    }
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-muted hover:text-ink"
                >
                  <Download className="size-4" /> Download (.doc)
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onManage(novel)
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-muted hover:text-ink"
                >
                  <Settings2 className="size-4" /> Cover & details
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete(novel)
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-red-500/90 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="size-4" /> Delete novel
                </button>
              </div>
            )}
          </div>
        </div>

        {novel.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{novel.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Clock className="size-3.5" /> Edited {timeAgo(novel.updatedAt)}
          </span>
          <div className="flex items-center gap-2">
            {novel.lastChapterTitle && (
              <span className="hidden max-w-32 truncate text-xs text-ink-faint md:inline">
                {novel.lastChapterTitle}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(novel)
              }}
              className="rounded-lg p-1.5 text-ink-faint hover:bg-red-500/10 hover:text-red-500 transition-colors"
              title="Delete novel"
              aria-label="Delete novel"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              onClick={openWorkspace}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold',
                novel.lastOpenedChapterId
                  ? 'bg-ember text-canvas shadow-sm shadow-ember/40 transition-colors hover:bg-ember-hover'
                  : 'border border-line text-ink-soft transition-colors hover:border-ember/50 hover:text-ember',
              )}
            >
              <Play className="size-3.5" />
              {novel.lastOpenedChapterId ? 'Resume' : 'Start'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function NovelCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line-soft bg-surface">
      <div className="aspect-[16/10] w-full skeleton" />
      <div className="flex flex-col gap-2 p-5">
        <div className="h-4 w-2/3 skeleton" />
        <div className="h-3 w-full skeleton" />
        <div className="h-3 w-1/2 skeleton" />
      </div>
    </div>
  )
}