import { fetchJson } from './client'
import type { User } from '../lib/types'

export const authApi = {
  me: () => fetchJson<{ user: User }>('/auth/me'),
  register: (input: { name: string; email: string; password: string }) =>
    fetchJson<{ user: User }>('/auth/register', { method: 'POST', body: input }),
  login: (input: { email: string; password: string }) =>
    fetchJson<{ user: User }>('/auth/login', { method: 'POST', body: input }),
  logout: () => fetchJson<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
}

export const googleUrl = '/api/auth/google'