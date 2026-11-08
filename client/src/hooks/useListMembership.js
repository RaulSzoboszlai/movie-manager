import { useCallback, useEffect, useRef, useState } from 'react'
import api from '../lib/api.js'

const IDLE = { status: 'idle', lists: [] }
const LOADING = { status: 'loading', lists: [] }
const FAILED = { status: 'error', lists: [] }

// Loads the user's lists with a hasMovie flag for one movie, and toggles that movie in them.
function useListMembership({ tmdbId, title, posterPath }) {
  const [result, setResult] = useState(IDLE)
  const controllerRef = useRef(null)

  const load = useCallback(() => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setResult(LOADING)

    api
      .get('/lists', { params: { tmdbId }, signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setResult({ status: 'ready', lists: response.data.lists })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult(FAILED)
      })
  }, [tmdbId])

  useEffect(() => () => controllerRef.current?.abort(), [])

  // Not optimistic: the checkbox changes only once the server has accepted the change.
  async function toggle(list) {
    try {
      if (list.hasMovie) {
        await api.delete(`/lists/${list.id}/movies/${tmdbId}`)
      } else {
        await api.post(`/lists/${list.id}/movies`, { tmdbId, title, posterPath })
      }
    } catch (err) {
      // The list was deleted elsewhere, so the menu is stale: reload it instead of reporting.
      if (err.response?.status === 404) {
        load()
        return
      }
      throw err
    }
    setResult((current) => ({
      ...current,
      lists: current.lists.map((item) => (item.id === list.id ? { ...item, hasMovie: !list.hasMovie } : item)),
    }))
  }

  return { ...result, load, toggle }
}

export default useListMembership
