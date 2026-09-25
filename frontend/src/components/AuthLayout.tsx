import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Logo } from './Logo'
import { fetchJson } from '../api/client'
import { BackgroundSlider } from './ui/BackgroundSlider'

export function useGoogleConfigured(): boolean | null {
  const [configured, setConfigured] = useState<boolean | null>(null)
  useEffect(() => {
    fetchJson<{ googleConfigured: boolean }>('/health')
      .then((h) => setConfigured(h.googleConfigured))
      .catch(() => setConfigured(false))
  }, [])
  return configured
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen relative bg-transparent overflow-hidden text-white w-full">
      <BackgroundSlider />

      <div className="hidden flex-1 flex-col justify-between border-r border-white/10 p-10 lg:flex relative z-10">
        <div className="brightness-200 contrast-125">
          <Logo />
        </div>
        <div className="max-w-sm text-white drop-shadow-md">
          <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-md border border-white/10">
            <BookOpen className="size-7" />
          </div>
          <blockquote className="font-serif text-2xl leading-relaxed text-white drop-shadow-lg">
            &ldquo;A writer is someone for whom writing is more difficult than it is for other
            people.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm italic text-white/80">— Thomas Mann</p>
        </div>
        <p className="text-xs text-white/70">
          WorldofNovel · Your stories, safe and waiting.
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:flex-1 relative z-10">
        <div className="w-full max-w-sm animate-fade-up bg-black/40 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-2xl border border-white/20 text-white">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint transition-colors hover:text-ink lg:hidden"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function GoogleButton({ disabledNote = true }: { disabledNote?: boolean }) {
  const configured = useGoogleConfigured()

  if (configured === null) {
    return (
      <div className="h-11 animate-pulse rounded-lg border border-line bg-elevated" />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <a
        href={configured ? '/api/auth/google' : undefined}
        aria-disabled={!configured}
        onClick={(e) => {
          if (!configured) e.preventDefault()
        }}
        className={
          configured
            ? 'flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-elevated px-4 py-2.5 text-sm font-medium text-ink-soft transition-all hover:border-ink-faint hover:text-ink'
            : 'flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-muted px-4 py-2.5 text-sm font-medium text-ink-faint'
        }
      >
        <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.44 1.18 4.94l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        {configured ? 'Continue with Google' : 'Google login not configured'}
      </a>
      {!configured && disabledNote && (
        <p className="text-center text-xs text-ink-faint">
          Ask the administrator to add Google OAuth credentials.
        </p>
      )}
    </div>
  )
}

export function Divider({ label = 'or' }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-line-soft" />
      <span className="text-xs uppercase tracking-wider text-ink-faint">{label}</span>
      <div className="h-px flex-1 bg-line-soft" />
    </div>
  )
}