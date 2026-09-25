export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const API_ROOT = '/api'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

export async function fetchJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers } = options

  let response: Response
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      credentials: 'include',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Please check your connection.')
  }

  if (response.status === 204) return undefined as T

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message =
      (payload as { error?: string } | null)?.error ?? 'Something went wrong. Please try again.'
    throw new ApiError(response.status, message)
  }

  return payload as T
}

export async function uploadFile(
  path: string,
  file: File,
  extraFields: Record<string, string> = {},
): Promise<{ url: string }> {
  const form = new FormData()
  form.append('file', file)
  for (const [key, value] of Object.entries(extraFields)) {
    form.append(key, value)
  }

  let response: Response
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    })
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Please check your connection.')
  }

  const payload = (await response.json().catch(() => null)) as { error?: string; url?: string } | null
  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error ?? 'Upload failed. Please try again.',
    )
  }
  if (!payload?.url) {
    throw new ApiError(response.status, 'Upload failed. Please try again.')
  }
  return { url: payload.url }
}