import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-ember text-white hover:bg-ember-hover shadow-sm shadow-ember/30 disabled:opacity-60',
  secondary:
    'bg-muted text-ink hover:bg-muted/70 border border-line-soft disabled:opacity-60',
  ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-muted disabled:opacity-60',
  outline:
    'border border-line text-ink-soft hover:text-ink hover:border-ember/60 disabled:opacity-60',
  danger:
    'bg-red-800/90 text-red-50 hover:bg-red-800 disabled:opacity-60',
}

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember',
        'active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}