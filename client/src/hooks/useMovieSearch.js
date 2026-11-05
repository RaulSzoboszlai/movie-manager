import { useEffect, useRef, useState } from 'react'
import api from '../lib/api.js'

const LOADING = { status: 'loading', movies: [], page: 0, totalPages: 0, focusCard: null }
const FAILED = { ...LOADING, status: 'error' }

function fetchPage(query, page, signal) {
  return api.get('/movies/search', { params: { q: query, page }, signal })
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
// same card twice still moves focus.
function nextFocusCard(previousCount, count, isLastPage, current) {
  if (count > previousCount) return { index: previousCount }
  return isLastPage ? { index: count - 1 } : current
}

/** Expects a remount (via `key`) when the query changes, so state never carries over. */
function useMovieSearch(query) {
  const [result, setResult] = useState(LOADING)
  const [loadMoreStatus, setLoadMoreStatus] = useState('idle')
  const [attempt, setAttempt] = useState(0)
  const loadMoreController = useRef(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchPage(query, 1, controller.signal)
      .then(({ data }) => {
        if (controller.signal.aborted) return
        setResult({
          status: 'ready',
          movies: appendUnique([], data.movies),
          page: data.page,
          totalPages: data.totalPages,
          focusCard: null,
        })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult(FAILED)
      })

    return () => {
      controller.abort()
      loadMoreController.current?.abort()
    }
  }, [query, attempt])

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
      const { data } = await fetchPage(query, result.page + 1, controller.signal)
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
      })
      setLoadMoreStatus('idle')
    } catch {
      if (!controller.signal.aborted) setLoadMoreStatus('error')
    } finally {
      loadMoreController.current = null
    }
  }

  return {
    ...result,
    hasMore: result.page < result.totalPages,
    loadMoreStatus,
    retry,
    loadMore,
  }
}

export default useMovieSearch
