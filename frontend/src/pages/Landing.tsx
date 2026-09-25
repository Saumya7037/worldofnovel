import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ArrowRight,
  BookOpen,
  Feather,
  GalleryHorizontal,
  Moon,
  PenLine,
  Save,
  Sparkles,
  SunMedium,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { BackgroundSlider, GENRES } from '../components/ui/BackgroundSlider'

function MockPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl animate-fade-up">
      <div className="editorial-rule" aria-hidden="true">
        <span className="text-sm tracking-[0.3em] text-ink-faint">Your writing studio</span>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-elevated shadow-2xl shadow-black/10">
        <div className="flex items-center justify-between border-b border-line-soft px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-ember/60" />
            <span className="size-3 rounded-full bg-muted" />
            <span className="size-3 rounded-full bg-muted" />
          </div>
          <div className="flex items-center gap-6 text-xs text-ink-faint">
            <span>The Last Kingdom</span>
            <span className="flex items-center gap-1.5">
              <Save className="size-3.5" />
              Saved just now
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-full bg-ember/20 ring-1 ring-ember/30" />
          </div>
        </div>
        <div className="grid grid-cols-[220px_1fr] max-md:grid-cols-1">
          <div className="border-r border-line-soft p-4 max-md:border-r-0 max-md:border-b">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Chapters
            </div>
            <ul className="flex flex-col gap-1 text-sm">
              {['The Hidden Door', 'Shadow of the Crown', 'A Long Road', 'Embers at Dusk', 'The Return'].map(
                (c, i) => (
                  <li
                    key={c}
                    className={
                      i === 0
                        ? 'rounded-lg bg-ember/10 px-3 py-2 font-medium text-ember'
                        : 'rounded-lg px-3 py-2 text-ink-soft'
                    }
                  >
                    {c}
                  </li>
                ),
              )}
            </ul>
            <div className="mt-4 rounded-lg border border-dashed border-line px-3 py-2 text-xs text-ink-faint">
              + New chapter
            </div>
          </div>
          <div className="p-8 md:p-12">
            <p className="font-serif text-2xl font-semibold text-ink">The Hidden Door</p>
            <div className="mt-5 space-y-4 font-body text-[15px] leading-7 text-ink-soft">
              <p>
                The castle appeared beyond the mountains, its towers pale against the evening sky.
                Elara had crossed half a kingdom to find it.
              </p>
              <p>
                The road wound through a pine forest where the wind carried whispers, and beneath
                her boots the old stones hummed with a song she almost remembered.
              </p>
              <p className="italic text-ink-faint">
                Somewhere inside, a door was waiting for her — the same door she had dreamed of
                every night since the war began.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="group rounded-2xl border border-line-soft bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-ember/40 hover:shadow-lg hover:shadow-black/5">
      <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-ember/10 text-ember transition-transform duration-200 group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mb-2 font-serif text-lg font-semibold text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  )
}

export function Landing() {
  const { user } = useAuth()
  usePageTitle('')

  const [currentGenre, setCurrentGenre] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentGenre((prev) => (prev + 1) % GENRES.length)
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-transparent relative isolate text-white">
      <BackgroundSlider />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            {user ? (
              <Link to="/dashboard">
                <Button>Open my studio</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button>Get started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="relative mx-auto w-full pb-20 pt-20 md:pt-28">
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-md transition-colors duration-500">
              <Sparkles className={`size-3.5 ${GENRES[currentGenre].accent} transition-colors duration-1000`} />
              Explore themes like <span className={`font-semibold ${GENRES[currentGenre].accent} transition-colors duration-1000`}>{GENRES[currentGenre].name}</span>
            </div>
            <h1 className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-7xl drop-shadow-lg">
              Write.
              <br />
              Create.
              <br />
              <span className={`${GENRES[currentGenre].accent} transition-colors duration-1000 drop-shadow-md`}>Continue your story.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/90 md:text-lg drop-shadow-md">
              WorldofNovel is where your novels live — a calm, beautiful workspace for drafting
              chapters, shaping worlds, and never losing your place again.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="shadow-xl hover:-translate-y-1 transition-all bg-ember/90 hover:bg-ember text-white border-0">
                    Open my studio <ArrowRight className="size-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="shadow-xl hover:-translate-y-1 transition-all bg-ember/90 hover:bg-ember text-white border-0">
                      Start writing free <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="secondary" className="backdrop-blur-xl bg-black/40 hover:bg-black/60 text-white border-white/20 transition-all">
                      I already have an account
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Genre selector dots */}
            <div className="mt-10 flex justify-center gap-2">
              {GENRES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentGenre(idx)}
                  className={`size-2.5 rounded-full transition-all duration-300 ${idx === currentGenre ? `w-8 ${GENRES[currentGenre].accent} bg-current` : 'bg-line hover:bg-ink-faint'}`}
                  aria-label={`Switch to genre ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <MockPreview />
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-white md:text-4xl drop-shadow-md">
              Everything a writer needs.
              <br />
              <span className="text-white/70">Nothing a writer doesn&apos;t.</span>
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Feature icon={<PenLine className="size-5" />} title="A serious writing editor">
              Rich text editing with formatting, headings, lists, images, and a distraction-free
              page for the words that matter.
            </Feature>
            <Feature icon={<Save className="size-5" />} title="Autosave you can trust">
              Your words are saved to the cloud as you type. Leave for days — return to the exact
              chapter you left.
            </Feature>
            <Feature icon={<BookOpen className="size-5" />} title="Organize your story">
              Chapters, front matter, covers, genres — a structure built for the way novels are
              actually made.
            </Feature>
            <Feature icon={<GalleryHorizontal className="size-5" />} title="Covers & inline images">
              Drop in a cover for each novel, and place images inside chapters exactly where they
              belong.
            </Feature>
            <Feature icon={<Feather className="size-5" />} title="Resume writing instantly">
              Every novel remembers your place. One click and you are back inside the scene.
            </Feature>
            <Feature icon={<Moon className="size-5" />} title="A workspace that respects you">
              Light and dark modes, elegant typography, and an interface designed for long writing
              sessions.
            </Feature>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-serif text-3xl font-semibold text-white md:text-4xl drop-shadow-md">
          Your next story is waiting.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-white/80">
          Open a blank page and start writing the world that exists only in your imagination.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="bg-ember hover:bg-ember/90 text-white border-0">
                Go to dashboard <ArrowRight className="size-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" className="bg-ember hover:bg-ember/90 text-white border-0">
                  Create my first novel <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary" className="backdrop-blur-xl bg-black/40 hover:bg-black/60 text-white border-white/20">
                  Sign in
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-8 bg-black/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-white/60 sm:flex-row sm:px-6">
          <p>WorldofNovel © 2026 · Your personal digital novel-writing studio.</p>
          <p className="flex items-center gap-1.5">
            <SunMedium className="size-3.5" /> Crafted for storytellers.
          </p>
        </div>
      </footer>
    </div>
  )
}