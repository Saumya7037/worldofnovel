import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import CharacterCount from '@tiptap/extension-character-count'
import type { TipTapDoc } from '../../lib/types'
import { uploadsApi } from '../../api/novels'
import { EditorToolbar } from './EditorToolbar'
import { ImageDialog } from './ImageDialog'
import { useToast } from '../ui/Toast'

interface EditorProps {
  doc: TipTapDoc | null
  onUpdate: (doc: TipTapDoc) => void
  onWordCountChange?: (words: number) => void
  placeholder?: string
  readOnly?: boolean
  novelId: string
  chapterId?: string
}

export function Editor({
  doc,
  onUpdate,
  onWordCountChange,
  placeholder = 'Start writing your chapter…',
  readOnly = false,
  novelId,
  chapterId,
}: EditorProps) {
  const { toast } = useToast()
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  const editor = useEditor({
    immediatelyRender: true,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Typography,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({
        allowBase64: false,
        inline: false,
        HTMLAttributes: { crossorigin: '' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: doc ?? undefined,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON() as TipTapDoc)
      onWordCountChange?.(editor.storage.characterCount.words())
    },
  })

  useEffect(() => {
    if (readOnly && editor) {
      editor.setEditable(false)
    }
  }, [editor, readOnly])

  const wordCount = editor ? (editor.storage.characterCount.words() ?? 0) : 0

  function openLink() {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL (https://…)', previous ?? 'https://')
    if (url === null) return
    const trimmed = url.trim()
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: trimmed })
      .run()
  }

  async function insertImage(file: File) {
    try {
      const { url } = await uploadsApi.image(file, { novelId, chapterId })
      editor?.chain().focus().setImage({ src: url }).run()
      setImageDialogOpen(false)
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Image upload failed.')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!readOnly && (
        <EditorToolbar
          editor={editor}
          onClickImage={() => setImageDialogOpen(true)}
          onLink={openLink}
        />
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-14">
          <EditorContent editor={editor} className="min-h-[60vh]" />
          {readOnly || (
            <footer className="mt-8 border-t border-line-soft pt-3 text-xs text-ink-faint">
              {wordCount.toLocaleString()} words
            </footer>
          )}
        </div>
      </div>
      {!readOnly && (
        <ImageDialog
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          onPick={(file) => void insertImage(file)}
        />
      )}
    </div>
  )
}