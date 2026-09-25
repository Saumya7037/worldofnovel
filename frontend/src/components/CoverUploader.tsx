import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { uploadsApi } from '../api/novels'
import { useToast } from './ui/Toast'
import { cn } from '../lib/utils'

interface CoverUploaderProps {
  value: string | null
  onPick?: (file: File | null) => void
  onChange?: (url: string | null) => void
  className?: string
  label?: string
  compact?: boolean
}

export function CoverUploader({ value, onPick, onChange, className, label, compact }: CoverUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('error', 'Please choose an image file (JPEG, PNG, WebP, or GIF).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('error', 'That image is larger than 10 MB. Try a smaller one.')
      return
    }
    if (onPick) {
      onPick(file)
      return
    }
    setUploading(true)
    try {
      if (onChange) {
        const { url } = await uploadsApi.cover(file)
        onChange(url)
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const previewUrl = value

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <span className="text-sm font-medium text-ink-soft">{label}</span>}
      <div className={cn('relative overflow-hidden rounded-lg border border-line', compact ? 'aspect-[1/1] w-20' : 'aspect-[2/3] w-32')}>
        {previewUrl ? (
          imagePreview(
            <img src={previewUrl} alt="Cover preview" className="size-full object-cover" />,
            () => inputRef.current?.click(),
            () => {
              onPick?.(null)
              onChange?.(null)
            },
          )
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'flex flex-col items-center justify-center gap-2 text-ink-faint transition-all hover:border-ember/50 hover:text-ember',
              compact ? 'aspect-[1/1] w-20' : 'aspect-[2/3] w-32',
            )}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="size-5" />
                {!compact && <span className="px-2 text-center text-[11px]">Add cover</span>}
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

function imagePreview(img: React.ReactNode, onReplace: () => void, onRemove: () => void) {
  return (
    <div className="group relative size-full">
      <div className="size-full">{img}</div>
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onReplace}
          className="rounded-md bg-white/90 p-1.5 text-ink hover:bg-white"
          aria-label="Replace cover"
        >
          <ImagePlus className="size-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md bg-white/90 p-1.5 text-red-600 hover:bg-white"
          aria-label="Remove cover"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}