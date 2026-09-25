import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CoverUploader } from '../CoverUploader'
import { GENRES } from '../../lib/constants'
import { novelsApi, uploadsApi } from '../../api/novels'
import { useToast } from '../ui/Toast'

interface CreateNovelModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (id: string) => void
}

export function CreateNovelModal({ open, onClose, onCreated }: CreateNovelModalProps) {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [genres, setGenres] = useState<string[]>([GENRES[0] ?? 'Fantasy'])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleCoverPick(file: File | null) {
    setCoverFile(file)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please give your novel a title.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await novelsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        authorName: author.trim(),
        genre: genres.join(', '),
      })
      const novel = res.novel
      if (coverFile) {
        try {
          const { url } = await uploadsApi.cover(coverFile)
          await novelsApi.update(novel.id, { coverImageUrl: url })
        } catch {
          toast('error', 'Novel created, but the cover upload failed.')
        }
      }
      toast('success', `"${novel.title}" is ready.`)
      onClose()
      onCreated?.(novel.id)
      navigate(`/novels/${novel.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the novel.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Start a new novel" size="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-500">
            {error}
          </div>
        )}
        <div className="flex items-start gap-6">
          <CoverUploader
            value={coverPreview}
            onPick={handleCoverPick}
            label="Cover (optional)"
          />
          <div className="flex flex-1 flex-col gap-4">
            <Input
              label="Title"
              required
              placeholder="The Last Kingdom"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Author name"
              placeholder="Your pen name (optional)"
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
          <label className="text-sm font-medium text-ink-soft" htmlFor="novel-description">
            Description
          </label>
          <textarea
            id="novel-description"
            rows={3}
            placeholder="A sentence or two about this story…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none rounded-lg border border-line bg-elevated px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember/40"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create novel
          </Button>
        </div>
      </form>
    </Modal>
  )
}