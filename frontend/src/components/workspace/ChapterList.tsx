import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { BookMarked, FilePlus2, GripVertical, MoreHorizontal, PenLine, Trash2 } from 'lucide-react'
import type { ChapterSummary } from '../../lib/types'
import { cn } from '../../lib/utils'

interface ChapterListProps {
  chapters: ChapterSummary[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAdd: () => void
  onReorder: (orderedIds: string[]) => void
  onRename: (id: string, title: string) => void
  onDelete: (id: string) => void
}

function SortableItem({
  chapter,
  selected,
  onSelect,
  onRename,
  onDelete,
}: {
  chapter: ChapterSummary
  selected: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(chapter.title)

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-1 rounded-lg px-1.5',
        isDragging && 'z-10 opacity-90',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab rounded p-1 text-ink-faint opacity-0 transition-opacity hover:bg-muted hover:text-ink group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Drag to reorder"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </button>
      <button
        onClick={onSelect}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
          selected ? 'bg-ember/10 font-medium text-ember' : 'text-ink-soft hover:bg-muted hover:text-ink',
        )}
      >
        <PenLine className="size-3.5 shrink-0 opacity-60" />
        <span className="truncate">{chapter.title}</span>
        <span className="ml-auto shrink-0 text-[10px] text-ink-faint">
          {chapter.wordCount > 0 ? chapter.wordCount.toLocaleString() : ''}
        </span>
      </button>
      {selected && !editing && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => {
              setDraft(chapter.title)
              setEditing(true)
            }}
            className="rounded p-1 text-ink-faint hover:bg-muted hover:text-ink"
            aria-label="Rename chapter"
          >
            <MoreHorizontal className="size-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1 text-ink-faint hover:bg-red-500/10 hover:text-red-500"
            aria-label="Delete chapter"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
      {editing && (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onRename(draft.trim() || chapter.title)
              setEditing(false)
            }
            if (e.key === 'Escape') setEditing(false)
          }}
          onBlur={() => {
            onRename(draft.trim() || chapter.title)
            setEditing(false)
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-24 rounded border border-ember/50 bg-elevated px-1.5 py-0.5 text-xs text-ink focus:outline-none"
        />
      )}
    </li>
  )
}

export function ChapterList({
  chapters,
  selectedId,
  onSelect,
  onAdd,
  onReorder,
  onRename,
  onDelete,
}: ChapterListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = chapters.map((c) => c.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    onReorder(arrayMove(ids, oldIndex, newIndex))
  }

  const items = chapters.map((c) => c.id)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        Chapters
      </div>
      {chapters.length === 0 && (
        <p className="mb-3 rounded-lg border border-dashed border-line px-3 py-2 text-xs leading-relaxed text-ink-faint">
          No chapters yet. Add your first chapter to start writing.
        </p>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <ul className="flex min-h-0 flex-col gap-0.5 overflow-y-auto pr-0.5">
            <li>
              <button
                onClick={() => onSelect(null)}
                className={cn(
                  'mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                  selectedId === null
                    ? 'bg-ember/10 font-medium text-ember'
                    : 'text-ink-soft hover:bg-muted hover:text-ink',
                )}
              >
                <BookMarked className="size-4 shrink-0" />
                <span className="truncate">Front matter</span>
              </button>
            </li>
            {chapters.map((c) => (
              <SortableItem
                key={c.id}
                chapter={c}
                selected={selectedId === c.id}
                onSelect={() => onSelect(c.id)}
                onRename={(title) => onRename(c.id, title)}
                onDelete={() => onDelete(c.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button
        onClick={onAdd}
        className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-ink-faint transition-colors hover:border-ember/50 hover:text-ember"
      >
        <FilePlus2 className="size-4" /> New chapter
      </button>
    </div>
  )
}