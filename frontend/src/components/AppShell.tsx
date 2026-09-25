import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Moon, Sun, User as UserIcon, Settings } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { Logo } from './Logo'
import { Avatar } from './ui/Avatar'
import { cn } from '../lib/utils'
import { BackgroundSlider } from './ui/BackgroundSlider'

interface AppShellProps {
  children: React.ReactNode
  headerExtra?: React.ReactNode
}

export function AppShell({ children, headerExtra }: AppShellProps) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-transparent relative isolate text-white">
      <BackgroundSlider />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" aria-label="Go to dashboard">
              <Logo compact />
            </Link>
            {headerExtra}
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <>
                <span className="hidden text-sm text-ink-soft sm:inline">
                  {user.name}
                </span>
                <button
                  onClick={toggle}
                  className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-muted hover:text-ink"
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="rounded-full transition-transform hover:scale-105"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <Avatar name={user.name} avatarUrl={user.avatarUrl} />
                  </button>
                  {menuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-line-soft bg-surface shadow-xl animate-scale-in"
                      role="menu"
                    >
                      <div className="border-b border-line-soft px-4 py-3">
                        <p className="text-sm font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-xs text-ink-faint">{user.email}</p>
                      </div>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false)
                          navigate('/dashboard')
                        }}
                        className={menuItem}
                      >
                        <UserIcon className="size-4" /> Dashboard
                      </button>
                      <button role="menuitem" onClick={handleLogout} className={cn(menuItem, 'text-red-500/90')}>
                        <LogOut className="size-4" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 relative z-10 p-6">{children}</main>
      <footer className="border-t border-white/10 py-6 relative z-10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-ink-faint sm:px-6">
          <p>WorldofNovel — your personal digital writing studio.</p>
          <p>Made for writers.</p>
        </div>
      </footer>
    </div>
  )
}

const menuItem =
  'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-muted hover:text-ink'

export function IconLink({ to, title }: { to: string; title: string }) {
  return (
    <Link
      to={to}
      title={title}
      className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-muted hover:text-ink"
    >
      <Settings className="size-5" />
    </Link>
  )
}