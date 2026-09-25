import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink-soft"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'rounded-lg border border-line bg-elevated px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint',
            'transition-colors duration-150',
            'focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember/40',
            error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/40',
            className,
          )}
          {...rest}
        />
        {error && (
          <p className="text-xs text-red-500/90">{error}</p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'