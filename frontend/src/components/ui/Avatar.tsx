import { cn, getInitials } from '../../lib/utils'

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  className?: string
}

export function Avatar({ name, avatarUrl, className }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('size-9 rounded-full object-cover ring-1 ring-line', className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex size-9 items-center justify-center rounded-full bg-ember/15 text-xs font-semibold text-ember ring-1 ring-ember/20',
        className,
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  )
}