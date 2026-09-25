import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../components/ui/Toast'
import { AuthLayout, Divider, GoogleButton } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong', 'Excellent']
  return { score, label: labels[Math.min(score, 5)] }
}

export function Register() {
  const { register } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  usePageTitle('Create account')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<{ name?: string; password?: string; confirm?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError({})

    if (name.trim().length < 1) {
      setFieldError((f) => ({ ...f, name: 'Please enter your name.' }))
      return
    }
    if (password.length < 8) {
      setFieldError((f) => ({ ...f, password: 'Password must be at least 8 characters.' }))
      return
    }
    if (password !== confirm) {
      setFieldError((f) => ({ ...f, confirm: 'Passwords do not match.' }))
      return
    }

    setSubmitting(true)
    try {
      await register(name, email, password)
      toast('success', 'Welcome to WorldofNovel!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  const strength = passwordStrength(password)

  return (
    <AuthLayout title="Create your studio" subtitle="A quiet place for your novels to grow.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-500">
            {error}
          </div>
        )}
        <Input
          label="Name"
          required
          autoComplete="name"
          placeholder="J.R. Starling"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldError.name}
        />
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldError.password}
          />
          {password.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={
                      i < strength.score
                        ? 'h-1 flex-1 rounded-full bg-ember transition-colors'
                        : 'h-1 flex-1 rounded-full bg-muted'
                    }
                  />
                ))}
              </div>
              <span className="w-14 text-right text-xs text-ink-faint">{strength.label}</span>
            </div>
          )}
        </div>
        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldError.confirm}
        />
        <Button type="submit" size="lg" loading={submitting} className="mt-1">
          Create account
        </Button>
      </form>

      <Divider />
      <GoogleButton />

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-ember hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}