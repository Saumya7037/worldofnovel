import { cn } from '../lib/utils'
import { Link } from 'react-router-dom'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="WorldofNovel home"
    >
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-ember text-canvas shadow-sm shadow-ember/40 transition-transform duration-200 group-hover:rotate-[-4deg]">
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a4 4 0 0 1 4 4V21a4 4 0 0 0-4-4H6.5A2.5 2.5 0 0 1 4 14.5v-9Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13a4 4 0 0 0-4 4v14a4 4 0 0 1 4-4h4.5a2.5 2.5 0 0 0 2.5-2.5v-9Z"
            fill="currentColor"
            opacity="0.55"
          />
        </svg>
      </span>
      {!compact && (
        <span className="font-serif text-lg font-semibold tracking-tight text-ink">
          Worldof<span className="text-ember">Novel</span>
        </span>
      )}
    </Link>
  )
}