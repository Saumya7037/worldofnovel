import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { BookPlus, ChevronRight, PenLine } from 'lucide-react'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { novelsApi } from '../api/novels'
import { timeAgo, getInitials } from '../lib/utils'
import type { NovelListItem } from '../lib/types'
import { NovelCard, NovelCardSkeleton } from '../components/dashboard/NovelCard'
import { CreateNovelModal } from '../components/dashboard/CreateNovelModal'
import { EditNovelModal } from '../components/dashboard/EditNovelModal'

export function Dashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  usePageTitle('Dashboard')

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<NovelListItem | null>(null)
  const [deleting, setDeleting] = useState<NovelListItem | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['novels'],
    queryFn: novelsApi.list,
  })

  const novels = useMemo(() => data?.novels ?? [], [data])

  const recentlyActive = useMemo(() => {
    if (!novels.length) return []
    return novels
      .filter((n) => n.chapterCount > 0)
      .sort((a, b) => new Date(b.lastOpenedAt ?? b.updatedAt).getTime() - new Date(a.lastOpenedAt ?? a.updatedAt).getTime())
      .slice(0, 2)
  }, [novels])

  function handleCreated() {
    void queryClient.invalidateQueries({ queryKey: ['novels'] })
  }

  function handleSaved(updated: NovelListItem) {
    void queryClient.setQueryData(['novels'], (old: { novels: NovelListItem[] } | undefined) => {
      if (!old) return old
      return {
        novels: old.novels.map((n) => (n.id === updated.id ? { ...n, ...updated } : n)),
      }
    })
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeletingLoading(true)
    try {
      await novelsApi.remove(deleting.id)
      toast('success', `"${deleting.title}" was deleted.`)
      void queryClient.invalidateQueries({ queryKey: ['novels'] })
      setDeleting(null)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Could not delete the novel.')
    } finally {
      setDeletingLoading(false)
    }
  }

  const firstName = user?.name.split(' ')[0] ?? 'Writer'
  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Writing late?' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <AppShell
      headerExtra={
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-sm text-ink-faint">Dashboard</span>
        </div>
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-ember/15 text-sm font-semibold text-ember ring-1 ring-ember/20">
              {getInitials(user?.name ?? 'W')}
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-ink">
                {greeting}, {firstName}.
              </h1>
              <p className="text-sm text-ink-faint">
                {novels.length === 0
                  ? 'Your studio is waiting for its first story.'
                  : novels.length === 1
                    ? 'One novel in your library.'
                    : `${novels.length} novels in your library.`}
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <BookPlus className="size-4" /> New novel
          </Button>
        </div>

        {isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <NovelCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-black/50 backdrop-blur-3xl py-16 text-center text-white shadow-2xl">
            <p className="font-serif text-xl">Could not load your novels.</p>
            <Button variant="secondary" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : novels.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-[3rem] border border-white/20 bg-black/60 shadow-2xl backdrop-blur-xl px-6 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-[1.5rem] bg-ember/20 text-ember border border-ember/30 shadow-[0_0_20px_rgba(223,122,66,0.3)]">
              <PenLine className="size-8" />
            </div>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-white drop-shadow-lg tracking-tight">Begin your first novel</h2>
            <p className="max-w-md text-base leading-relaxed text-zinc-300 drop-shadow-md">
              Every masterpiece starts with a single chapter. The tools you need to build worlds, draft manuscripts, and tell brilliant stories are waiting for you.
            </p>
            <Button className="mt-6 px-10 py-6 text-base font-semibold shadow-[0_0_25px_rgba(223,122,66,0.5)] transition-all hover:shadow-[0_0_35px_rgba(223,122,66,0.7)]" onClick={() => setCreateOpen(true)}>
              <BookPlus className="size-5 mr-3" /> Create your first novel
            </Button>
          </div>
        ) : (
          <>
            {recentlyActive.length > 0 && (
              <section className="mb-10">
                <div className="mb-4 flex items-end justify-between">
                  <h2 className="font-serif text-lg font-semibold text-ink">Continue writing</h2>
                  <span className="text-xs text-ink-faint">Picked up where you left off</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {recentlyActive.map((n) => (
                    <Link
                      key={n.id}
                      to={`/novels/${n.id}${n.lastOpenedChapterId ? `/chapters/${n.lastOpenedChapterId}` : ''}`}
                      className="group flex items-center gap-4 rounded-2xl border border-line-soft bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-ember/40 hover:shadow-lg hover:shadow-black/5"
                    >
                      {n.coverImageUrl ? (
                        <img
                          src={n.coverImageUrl}
                          alt=""
                          className="size-14 shrink-0 rounded-lg object-cover ring-1 ring-line"
                        />
                      ) : (
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-ember/10 text-ember">
                          <PenLine className="size-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif font-semibold text-ink">{n.title}</p>
                        <p className="truncate text-sm text-ink-soft">
                          {n.lastChapterTitle ?? `${n.chapterCount} chapters`} ·{' '}
                          {timeAgo(n.lastOpenedAt ?? n.updatedAt)}
                        </p>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-ember" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="mb-4 flex items-end justify-between">
                <h2 className="font-serif text-lg font-semibold text-ink">Your library</h2>
                <span className="text-xs text-ink-faint">
                  {novels.length} novel{novels.length === 1 ? '' : 's'}
                </span>
              </div>
              {novels.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line bg-elevated/50 px-6 py-12 text-center text-sm text-ink-faint">
                  Click “New novel” above to start writing.
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {novels.map((n) => (
                    <NovelCard
                      key={n.id}
                      novel={n}
                      onManage={setEditing}
                      onDelete={setDeleting}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <CreateNovelModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      {editing && (
        <EditNovelModal
          novel={editing}
          open={true}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <ConfirmDialog
          open={true}
          title="Delete this novel?"
          message={
            <>
              “{deleting.title}” will be permanently deleted, including every chapter and image.
              This cannot be undone.
            </>
          }
          confirmLabel="Delete novel"
          loading={deletingLoading}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleting(null)}
        />
      )}
    </AppShell>
  )
}