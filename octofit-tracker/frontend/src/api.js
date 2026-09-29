const codespaceName = import.meta.env.VITE_CODESPACE_NAME?.trim()

export const API_BASE_URL = codespaceName
  ? `https://${codespaceName}-8000.app.github.dev/api`
  : 'http://localhost:8000/api'

export async function apiRequest(path, { token, method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error(`Could not reach the OctoFit API at ${API_BASE_URL}.`)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed with status ${response.status}.`)
  }
  return payload
}

function findCollection(value) {
  if (Array.isArray(value)) return { items: value, metadata: {} }
  if (!value || typeof value !== 'object') return null

  for (const key of ['items', 'results', 'docs', 'entries', 'data', 'records', 'users', 'activities', 'teams', 'workouts']) {
    const candidate = value[key]
    if (Array.isArray(candidate)) return { items: candidate, metadata: value }
    if (candidate && typeof candidate === 'object') {
      const nested = findCollection(candidate)
      if (nested) return { items: nested.items, metadata: { ...nested.metadata, ...value } }
    }
  }
  return null
}

export function normalizeCollection(payload) {
  const collection = findCollection(payload) || { items: [], metadata: {} }
  const metadata = {
    ...(collection.metadata.pagination || {}),
    ...(collection.metadata.meta || {}),
    ...collection.metadata,
  }
  const items = collection.items
  const total = Number(metadata.total ?? metadata.totalCount ?? metadata.totalItems ?? metadata.totalDocs ?? metadata.count ?? items.length)
  const page = Number(metadata.page ?? metadata.currentPage ?? metadata.pageNumber ?? 1)
  const pageSize = Number(metadata.pageSize ?? metadata.perPage ?? metadata.limit ?? items.length ?? 1) || 1
  const totalPages = Number(metadata.totalPages ?? metadata.pages ?? Math.ceil(total / pageSize))

  return {
    items,
    total: Number.isFinite(total) ? total : items.length,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : Math.max(items.length, 1),
    totalPages: Number.isFinite(totalPages) ? totalPages : 1,
    payload,
  }
}