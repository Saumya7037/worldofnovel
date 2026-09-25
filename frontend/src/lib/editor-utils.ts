import type { TipTapDoc } from './types'

export const EMPTY_DOC: TipTapDoc = { type: 'doc', content: [{ type: 'paragraph' }] }

export function isEmptyDoc(doc: unknown): boolean {
  if (!doc || typeof doc !== 'object') return true
  const d = doc as { type?: string; content?: unknown[] }
  if (d.type !== 'doc') return true
  if (!Array.isArray(d.content) || d.content.length === 0) return true
  return d.content.every((n) => {
    const node = n as { type?: string; text?: string; content?: unknown[] }
    if (!node) return true
    if (node.type === 'hardBreak') return false
    return (
      node.type === 'paragraph' &&
      !node.text &&
      (!Array.isArray(node.content) || node.content.length === 0)
    )
  })
}