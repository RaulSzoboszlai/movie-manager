import { useEffect, useRef, useState } from 'react'
import api from '../lib/api.js'

const LOADING = { status: 'loading', movies: [], page: 0, totalPages: 0, focusCard: null, addedNone: false }
const FAILED = { ...LOADING, status: 'error' }

// Axios leaves out undefined params, so unset filters never reach the URL.
function fetchPage({ query, genre, year }, page, signal) {
  const params = { q: query || undefined, genre: genre || undefined, year: year || undefined, page }
  return api.get('/movies/search', { params, signal })
}

// TMDB can repeat a movie across pages, and tmdbId is the React key.
function appendUnique(movies, incoming) {
  const seen = new Set(movies.map((movie) => movie.tmdbId))
  const added = incoming.filter((movie) => {
    if (seen.has(movie.tmdbId)) return false
    seen.add(movie.tmdbId)
    return true
  })
  return [...movies, ...added]
}

// Load more keeps focus while it stays on screen. An object, so that asking for the
// same card twice still moves focus. With no cards at all, the object only signals
// that focus must move, and SearchResults sends it to the empty message.
function nextFocusCard(previousCount, count, isLastPage, current) {
  if (count > previousCount) return { index: previousCount }
  return isLastPage ? { index: Math.max(count - 1, 0) } : current
}

/** Expects a remount (via `key`) when the search changes, so state never carries over. */
function useMovieSearch({ query, genre, year }) {
  const [result, setResult] = useState(LOADING)
  const [loadMoreStatus, setLoadMoreStatus] = useState('idle')
  const [attempt, setAttempt] = useState(0)
  const loadMoreController = useRef(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchPage({ query, genre, year }, 1, controller.signal)
      .then(({ data }) => {
        if (controller.signal.aborted) return
        const movies = appendUnique([], data.movies)
        setResult({
          status: 'ready',
          movies,
          page: data.page,
          totalPages: data.totalPages,
          focusCard: null,
          addedNone: movies.length === 0,
        })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult(FAILED)
      })

    return () => {
      controller.abort()
      loadMoreController.current?.abort()
    }
  }, [query, genre, year, attempt])

  function retry() {
    setResult(LOADING)
    setAttempt((current) => current + 1)
  }

  async function loadMore() {
    if (loadMoreController.current) return

    const controller = new AbortController()
    loadMoreController.current = controller
    setLoadMoreStatus('loading')

    try {
      const { data } = await fetchPage({ query, genre, year }, result.page + 1, controller.signal)
      if (controller.signal.aborted) return

      const movies = appendUnique(result.movies, data.movies)
      setResult({
        ...result,
        movies,
        page: data.page,
        totalPages: data.totalPages,
        focusCard: nextFocusCard(
          result.movies.length,
          movies.length,
          data.page >= data.totalPages,
          result.focusCard,
        ),
        addedNone: movies.length === result.movies.length,
      })
      setLoadMoreStatus('idle')
    } catch {
      if (!controller.signal.aborted) setLoadMoreStatus('error')
    } finally {
      loadMoreController.current = null
    }
  }

  const hasMore = result.page < result.totalPages

  return {
    ...result,
    hasMore,
    noNewMatches: result.addedNone && hasMore,
    loadMoreStatus,
    retry,
    loadMore,
  }
}

export default useMovieSearch
