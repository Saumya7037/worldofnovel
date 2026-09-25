export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function formatWords(n: number): string {
  return n.toLocaleString('en-US')
}

export function timeAgo(dateValue: string | null | undefined): string {
  if (!dateValue) return 'never'
  const date = new Date(dateValue)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (Number.isNaN(seconds)) return 'recently'

  const units: Array<[number, string]> = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2592000, 'week'],
    [31536000, 'month'],
    [Infinity, 'year'],
  ]

  let prev = 1
  for (const [threshold, label] of units) {
    if (seconds < threshold) {
      const value = Math.max(1, Math.floor(seconds / prev))
      const plural = value === 1 ? '' : 's'
      return `${value} ${label}${plural} ago`
    }
    prev = threshold
  }
  return 'recently'
}

export function formatTimestamp(dateValue: string): string {
  const date = new Date(dateValue)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today, ${time}`
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${time}`
}

export function emptyDoc(): TipTapDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

interface TipTapDoc {
  type: 'doc'
  content?: Array<Record<string, unknown>>
  [key: string]: unknown
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}