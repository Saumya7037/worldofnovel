import { useRef, useState, type FormEvent } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { ImagePlus } from 'lucide-react'

interface ImageDialogProps {
  open: boolean
  onClose: () => void
  onPick: (file: File) => void
}

export function ImageDialog({ open, onClose, onPick }: ImageDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    onClose()
  }

  function choose(f: File | undefined) {
    if (!f) return
    if (!f.type.startsWith('image/')) return
    setFile(f)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(f))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!file) return
    onPick(file)
  }

  return (
    <Modal open={open} onClose={handleClose} title="Insert image" size="sm">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft">
          Add an image to illustrate this chapter. It will be uploaded and placed at your cursor.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-44 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line-soft bg-elevated text-ink-faint transition-colors hover:border-ember/50 hover:text-ember"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-36 rounded-lg object-contain" />
          ) : (
            <>
              <ImagePlus className="size-8" />
              <span className="text-sm">Click to choose an image</span>
            </>
          )}
        </button>
        <span className="text-center text-xs text-ink-faint">
          JPEG, PNG, WebP or GIF · up to 5 MB
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            choose(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!file}>
            Insert image
          </Button>
        </div>
      </form>
    </Modal>
  )
}