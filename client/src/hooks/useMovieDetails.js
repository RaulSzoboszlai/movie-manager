import { useEffect, useState } from 'react'
import api from '../lib/api.js'

// Also keeps /movie/trending from requesting /api/movies/trending, a different route.
const TMDB_ID_PATTERN = /^[1-9]\d{0,8}$/

const LOADING = { status: 'loading', movie: null }
const NOT_FOUND = { status: 'notFound', movie: null }
const FAILED = { status: 'error', movie: null }

function useMovieDetails(tmdbId) {
  const isValidId = TMDB_ID_PATTERN.test(tmdbId)
  const [result, setResult] = useState(isValidId ? LOADING : NOT_FOUND)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!isValidId) return undefined

    const controller = new AbortController()

    api
      .get(`/movies/${tmdbId}`, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setResult({ status: 'ready', movie: response.data.movie })
      })
      .catch((err) => {
        if (!controller.signal.aborted) setResult(err.response?.status === 404 ? NOT_FOUND : FAILED)
      })

    return () => controller.abort()
  }, [tmdbId, isValidId, attempt])

  function retry() {
    setResult(LOADING)
    setAttempt((current) => current + 1)
  }

  return { ...result, retry }
}

export default useMovieDetails
