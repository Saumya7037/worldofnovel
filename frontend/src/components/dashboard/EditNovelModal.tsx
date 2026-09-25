import { useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CoverUploader } from '../CoverUploader'
import { GENRES } from '../../lib/constants'
import type { NovelListItem } from '../../lib/types'
import { novelsApi } from '../../api/novels'
import { useToast } from '../ui/Toast'

interface EditNovelModalProps {
  novel: NovelListItem
  open: boolean
  onClose: () => void
  onSaved: (novel: NovelListItem) => void
}

export function EditNovelModal({ novel, open, onClose, onSaved }: EditNovelModalProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState(novel.title)
  const [author, setAuthor] = useState(novel.authorName ?? '')
  const [description, setDescription] = useState(novel.description ?? '')
  const [genres, setGenres] = useState<string[]>(novel.genre ? novel.genre.split(', ') : [GENRES[0]])
  const [coverUrl, setCoverUrl] = useState<string | null>(novel.coverImageUrl)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title cannot be empty.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await novelsApi.update(novel.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        authorName: author.trim() || null,
        genre: genres.join(', '),
        coverImageUrl: coverUrl,
      })
      onSaved({ ...novel, ...res.novel })
      toast('success', 'Novel details saved.')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit novel details" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-500">
            {error}
          </div>
        )}
        <div className="flex items-start gap-6">
          <CoverUploader value={coverUrl} onChange={setCoverUrl} label="Cover" />
          <div className="flex flex-1 flex-col gap-4">
            <Input
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Author name"
              placeholder="Pen name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-soft">
                Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenres((curr) => curr.includes(g) ? curr.filter((x) => x !== g) : [...curr, g])}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${genres.includes(g)
                        ? 'bg-ember text-canvas shadow-sm'
                        : 'bg-elevated border border-line text-ink-soft hover:border-ember/50 hover:text-ink'
                      }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-soft" htmlFor="edit-description">
            Description
          </label>
          <textarea
            id="edit-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none rounded-lg border border-line bg-elevated px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember/40"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}