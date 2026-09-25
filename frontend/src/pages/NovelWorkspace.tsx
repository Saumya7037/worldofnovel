import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  CloudOff,
  FilePlus2,
  GripVertical,
  Library,
  Loader2,
  Moon,
  Settings2,
  Sun,
  Trash2,
  Download,
} from 'lucide-react'
import { novelsApi, chaptersApi } from '../api/novels'
import { useTheme } from '../hooks/useTheme'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Editor } from '../components/editor/Editor'
import { ChapterList } from '../components/workspace/ChapterList'
import { EditNovelModal } from '../components/dashboard/EditNovelModal'
import { AUTOSAVE_DELAY_MS } from '../lib/constants'
import { downloadNovelAsDoc, downloadChapterAsDoc } from '../lib/export'
import type { Chapter, TipTapDoc, NovelListItem, NovelDetail } from '../lib/types'
import { cn } from '../lib/utils'

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'
type PendingSave =
  | { kind: 'chapter'; id: string; content: TipTapDoc }
  | { kind: 'frontMatter'; content: TipTapDoc }

export function NovelWorkspace() {
  const { novelId = '', chapterId: routeChapterId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { theme, toggle } = useTheme()

  const queryClientKey = ['novels', novelId]

  const novelQuery = useQuery({
    queryKey: ['novels', novelId],
    queryFn: () => novelsApi.get(novelId),
    enabled: !!novelId,
  })

  const chaptersQuery = useQuery({
    queryKey: [...queryClientKey, 'chapters'],
    queryFn: () => novelsApi.listChapters(novelId),
    enabled: !!novelId,
  })

  const novel = novelQuery.data?.novel ?? null
  const chapters = useMemo(() => chaptersQuery.data?.chapters ?? [], [chaptersQuery.data])

  const [selectedId, setSelectedId] = useState<string | null>('__pending__')
  const selectionReady = useRef(false)

  useEffect(() => {
    if (selectionReady.current) return
    if (!novel || chaptersQuery.isPending) return
    const target = routeChapterId ?? novel.lastOpenedChapterId ?? null
    selectionReady.current = true
    setSelectedId(target)
  }, [novel, chaptersQuery.isPending, routeChapterId])

  const selectedChapter = useMemo(
    () => (selectedId === null || selectedId === '__pending__' ? undefined : chapters.find((c) => c.id === selectedId)),
    [chapters, selectedId],
  )

  const selectedChapterId = selectedId === null || selectedId === '__pending__' ? null : (selectedId as string)

  const saveTimerRef = useRef<number | null>(null)
  const pendingRef = useRef<PendingSave | null>(null)
  const dirtyRef = useRef(false)
  const statusRef = useRef<SaveStatus>('idle')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteNovelOpen, setDeleteNovelOpen] = useState(false)
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const applyStatus = useCallback((s: SaveStatus) => {
    statusRef.current = s
    setSaveStatus(s)
  }, [])

  const flushSave = useCallback(async (): Promise<void> => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    const pending = pendingRef.current
    if (!pending) {
      if (statusRef.current === 'unsaved') applyStatus('idle')
      return
    }
    pendingRef.current = null
    applyStatus('saving')
    try {
      if (pending.kind === 'chapter') {
        await chaptersApi.update(pending.id, { content: pending.content })
      } else {
        await novelsApi.updateFrontMatter(novelId, pending.content)
      }
      dirtyRef.current = true
      applyStatus('saved')
      window.setTimeout(() => {
        if (statusRef.current === 'saved') applyStatus('idle')
      }, 2500)
    } catch {
      pendingRef.current = pending
      applyStatus('error')
    }
  }, [applyStatus, novelId])

  const scheduleSave = useCallback(
    (pending: PendingSave) => {
      pendingRef.current = pending
      applyStatus('unsaved')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = window.setTimeout(() => void flushSave(), AUTOSAVE_DELAY_MS)
    },
    [applyStatus, flushSave],
  )

  const handleEditorUpdate = useCallback(
    (doc: TipTapDoc, kind: PendingSave['kind'], id?: string) => {
      if (kind === 'chapter') {
        scheduleSave({ kind: 'chapter', id: id!, content: doc })
      } else {
        scheduleSave({ kind: 'frontMatter', content: doc })
      }
    },
    [scheduleSave],
  )

  const setProgress = useCallback(
    (chapterId: string | null) => {
      if (!novelId) return
      void novelsApi.setProgress(novelId, chapterId).catch(() => { })
    },
    [novelId],
  )

  const select = useCallback(
    async (id: string | null) => {
      await flushSave()
      setSelectedId(id)
      setProgress(id)
      navigate(id ? `/novels/${novelId}/chapters/${id}` : `/novels/${novelId}`, { replace: true })
    },
    [flushSave, navigate, novelId, setProgress],
  )

  useEffect(() => {
    if (selectionReady.current && selectedChapterId !== null) {
      setProgress(selectedChapterId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapterId])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (statusRef.current === 'unsaved' || statusRef.current === 'saving') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      void flushSave()
      if (dirtyRef.current) {
        void queryClient.invalidateQueries({ queryKey: ['novels'] })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function addChapter() {
    const n = chapters.length + 1
    await flushSave()
    const res = await novelsApi.createChapter(novelId, { title: `Chapter ${n}` })
    await chaptersQuery.refetch()
    setSelectedId(res.chapter.id)
    setProgress(res.chapter.id)
    navigate(`/novels/${novelId}/chapters/${res.chapter.id}`, { replace: true })
  }

  async function renameChapter(id: string, title: string) {
    const existing = chapters.find((c) => c.id === id)
    if (!existing || existing.title === title) return
    try {
      await chaptersApi.update(id, { title })
      queryClient.setQueryData(['novels', novelId, 'chapters'], (old: { chapters: Chapter[] } | undefined) => {
        if (!old) return old
        return {
          chapters: old.chapters.map((c) => (c.id === id ? { ...c, title } : c)),
        }
      })
      dirtyRef.current = true
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Could not rename the chapter.')
    }
  }

  async function confirmDeleteChapter() {
    if (!deleteChapterId) return
    try {
      await chaptersApi.remove(deleteChapterId)
      const next =
        selectedId === deleteChapterId
          ? chapters.find((c) => c.id !== deleteChapterId)?.id ?? null
          : selectedId
      await chaptersQuery.refetch()
      setSelectedId(next)
      setProgress(next)
      dirtyRef.current = true
      toast('success', 'Chapter deleted.')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Could not delete the chapter.')
    } finally {
      setDeleteChapterId(null)
    }
  }

  async function confirmDeleteNovel() {
    try {
      await novelsApi.remove(novelId)
      toast('success', `"${novel?.title ?? 'Novel'}" was deleted.`)
      void queryClient.invalidateQueries({ queryKey: ['novels'] })
      navigate('/dashboard')
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Could not delete the novel.')
    } finally {
      setDeleteNovelOpen(false)
    }
  }

  function handleReorder(orderedIds: string[]) {
    queryClient.setQueryData(['novels', novelId, 'chapters'], (old: { chapters: Chapter[] } | undefined) => {
      if (!old) return old
      const map = new Map(old.chapters.map((c) => [c.id, c]))
      const reordered = orderedIds
        .map((id) => map.get(id))
        .filter((c): c is Chapter => Boolean(c))
      reordered.forEach((c, i) => {
        c.chapterOrder = i
      })
      return { chapters: reordered }
    })
    dirtyRef.current = true
    void novelsApi.reorder(novelId, orderedIds).catch((err) => {
      toast('error', err instanceof Error ? err.message : 'Could not reorder chapters.')
      void chaptersQuery.refetch()
    })
  }

  function handleWordCountChange(id: string, words: number) {
    queryClient.setQueryData(['novels', novelId, 'chapters'], (old: { chapters: Chapter[] } | undefined) => {
      if (!old) return old
      return {
        chapters: old.chapters.map((c) => (c.id === id ? { ...c, wordCount: words } : c)),
      }
    })
  }

  const editingNovelItem: NovelListItem | null = useMemo(() => {
    if (!novel) return null
    return novel as unknown as NovelListItem
  }, [novel])

  const totalWords = useMemo(() => chapters.reduce((s, c) => s + (c.wordCount ?? 0), 0), [chapters])

  usePageTitle(
    novel
      ? selectedId === null
        ? `Front matter · ${novel.title}`
        : `${selectedChapter?.title ?? 'Chapter'} · ${novel.title}`
      : 'Novel',
  )

  const handleDownloadFull = useCallback(async () => {
    if (!novel) return
    toast('success', 'Fetching all chapters for download...')
    try {
      downloadNovelAsDoc(novel as unknown as NovelDetail, chapters)
      toast('success', 'Download complete.')
    } catch (e) {
      toast('error', 'Download failed.')
    }
  }, [novel, chapters, toast])

  const handleDownloadChapter = useCallback(() => {
    if (!novel || !selectedChapter) return
    downloadChapterAsDoc(novel.title, selectedChapter)
    toast('success', 'Downloaded chapter.')
  }, [novel, selectedChapter, toast])

  const saveLabel =
    saveStatus === 'unsaved'
      ? { text: 'Unsaved changes', icon: <CloudOff className="size-3.5" />, cls: 'text-amber-600 dark:text-amber-400' }
      : saveStatus === 'saving'
        ? { text: 'Saving…', icon: <Loader2 className="size-3.5 animate-spin" />, cls: 'text-ink-faint' }
        : saveStatus === 'saved'
          ? { text: 'Saved', icon: <Check className="size-3.5" />, cls: 'text-emerald-600 dark:text-emerald-400' }
          : saveStatus === 'error'
            ? { text: 'Save failed', icon: <CloudOff className="size-3.5" />, cls: 'text-red-500' }
            : { text: 'All changes saved', icon: <Check className="size-3.5" />, cls: 'text-ink-faint' }

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line-soft bg-elevated px-3 sm:px-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" /> Library
        </Link>
        <div className="mx-1 h-5 w-px bg-line-soft" />
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-ink-soft transition-colors hover:bg-muted hover:text-ink lg:hidden"
          aria-label={sidebarOpen ? 'Hide chapter list' : 'Show chapter list'}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="min-w-0 flex-1 truncate text-left"
          title="Open novel settings"
        >
          <span className="truncate font-serif text-lg font-semibold text-ink">
            {novel?.title ?? 'Loading novel…'}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <span className={cn('hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs sm:flex', saveLabel.cls)}>
            {saveLabel.icon} {saveLabel.text}
          </span>
          <button
            onClick={toggle}
            className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-muted hover:text-ink"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          </button>
          <button
            onClick={handleDownloadFull}
            className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-muted hover:text-ink"
            aria-label="Download Novel"
            title="Download Novel (.doc)"
          >
            <Download className="size-4.5" />
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-muted hover:text-ink"
            aria-label="Novel settings"
          >
            <Settings2 className="size-4.5" />
          </button>
          <button
            onClick={() => setDeleteNovelOpen(true)}
            className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-red-500/10 hover:text-red-500"
            aria-label="Delete novel"
          >
            <Trash2 className="size-4.5" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            'w-72 shrink-0 flex-col border-r border-line-soft bg-elevated/60 transition-all',
            sidebarOpen ? 'flex' : 'hidden lg:flex lg:w-60',
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
            <ChapterList
              chapters={chapters}
              selectedId={selectedChapterId}
              onSelect={(id) => void select(id)}
              onAdd={() => void addChapter()}
              onReorder={handleReorder}
              onRename={(id, title) => void renameChapter(id, title)}
              onDelete={setDeleteChapterId}
            />
            <div className="border-t border-line-soft pt-3 text-xs text-ink-faint">
              <p className="truncate">
                {novel?.genre && <span className="font-medium text-ink-soft">{novel.genre}</span>}
                {novel?.genre && ' · '}
                {chapters.length} chapter{chapters.length === 1 ? '' : 's'} ·{' '}
                {totalWords.toLocaleString()} words
              </p>
            </div>
          </div>
        </aside>

        {/* Editor pane */}
        <main className="flex min-w-0 flex-1 flex-col">
          {novelQuery.isPending || chaptersQuery.isPending ? (
            <div className="flex flex-col gap-6 p-10">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-96 w-full" />
            </div>
          ) : selectedChapterId === null ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-6 pt-10 md:px-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">
                  Front matter
                </p>
                <h1 className="font-serif text-3xl font-semibold text-ink">
                  {novel?.title ?? ''}
                </h1>
                <p className="text-sm text-ink-soft">
                  Dedications, acknowledgments, epigraphs — the pages that frame your story.
                </p>
              </div>
              <Editor
                key="front-matter"
                doc={novel?.frontMatter?.content ?? null}
                placeholder="Dedicate this work, add an epigraph, or begin your preface…"
                novelId={novelId}
                onUpdate={(doc) => handleEditorUpdate(doc, 'frontMatter')}
              />
            </div>
          ) : selectedChapter && selectedChapterId ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-1 px-6 pt-8 md:px-10">
                <input
                  key="title"
                  defaultValue={selectedChapter.title}
                  onBlur={(e) => void renameChapter(selectedChapterId, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void renameChapter(selectedChapterId, (e.target as HTMLInputElement).value)
                        ; (e.target as HTMLInputElement).blur()
                    }
                  }}
                  className="w-full bg-transparent font-serif text-3xl font-semibold text-ink placeholder:text-ink-faint focus:outline-none"
                  placeholder="Chapter title"
                  aria-label="Chapter title"
                />
                <button
                  onClick={handleDownloadChapter}
                  className="absolute right-6 top-8 rounded-lg p-2 text-ink-soft transition-colors hover:bg-muted hover:text-ink md:right-10"
                  title="Download Chapter (.doc)"
                >
                  <Download className="size-4.5" />
                </button>
              </div>
              <Editor
                key={selectedChapterId}
                doc={selectedChapter.content ?? null}
                novelId={novelId}
                chapterId={selectedChapterId}
                onUpdate={(doc) => handleEditorUpdate(doc, 'chapter', selectedChapterId)}
                onWordCountChange={(w) => handleWordCountChange(selectedChapterId, w)}
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <Library className="size-10 text-ink-faint" />
              <p className="font-serif text-xl text-ink">Choose a chapter, or start one now.</p>
              <Button onClick={() => void addChapter()}>
                <FilePlus2 className="size-4" /> Start a new chapter
              </Button>
            </div>
          )}
        </main>
      </div>

      {editingNovelItem && (
        <EditNovelModal
          novel={editingNovelItem}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {
            dirtyRef.current = true
            void novelQuery.refetch()
            void queryClient.invalidateQueries({ queryKey: ['novels'] })
          }}
        />
      )}
      <ConfirmDialog
        open={deleteNovelOpen}
        title="Delete this novel?"
        message={
          <>
            “{novel?.title ?? '…'}” and all its chapters and images will be permanently deleted.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete novel"
        onConfirm={() => void confirmDeleteNovel()}
        onCancel={() => setDeleteNovelOpen(false)}
      />
      <ConfirmDialog
        open={deleteChapterId !== null}
        title="Delete this chapter?"
        message="This chapter and its text will be permanently deleted."
        confirmLabel="Delete chapter"
        onConfirm={() => void confirmDeleteChapter()}
        onCancel={() => setDeleteChapterId(null)}
      />
    </div>
  )
}