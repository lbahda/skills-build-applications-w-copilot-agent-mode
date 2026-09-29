import { useEffect, useState } from 'react'
import { apiRequest, normalizeCollection } from '../api.js'

const emptyCollection = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 1,
  totalPages: 0,
  payload: null,
}

export function useCollection(path, token) {
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState({ ...emptyCollection, requestKey: '', loading: false, error: '' })
  const requestKey = JSON.stringify([path, token, reloadKey])

  useEffect(() => {
    const controller = new AbortController()
    let current = true

    apiRequest(path, { token, signal: controller.signal })
      .then((payload) => {
        if (current) setState({ ...normalizeCollection(payload), requestKey, loading: false, error: '' })
      })
      .catch((error) => {
        if (current && error.name !== 'AbortError') {
          setState({ ...emptyCollection, requestKey, loading: false, error: error.message })
        }
      })

    return () => {
      current = false
      controller.abort()
    }
  }, [path, requestKey, token])

  const isCurrentRequest = state.requestKey === requestKey
  const currentState = isCurrentRequest ? state : emptyCollection

  return {
    ...currentState,
    loading: !isCurrentRequest || state.loading,
    error: isCurrentRequest ? state.error : '',
    refresh: () => setReloadKey((value) => value + 1),
  }
}