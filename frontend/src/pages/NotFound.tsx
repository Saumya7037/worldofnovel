import { Button } from '../components/ui/Button'
import { Logo } from '../components/Logo'

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Logo />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-serif text-6xl text-ink">404</p>
        <p className="font-serif text-3xl text-ink">Page not found</p>
        <p className="max-w-sm text-ink-soft">
          This page has wandered off into another story. The dashboard is still exactly where you
          left it.
        </p>
        <a href="/dashboard" className="mt-2">
          <Button>Back to my studio</Button>
        </a>
      </div>
    </div>
  )
}