import { useEffect, useState } from 'react'
import api from '../lib/api.js'

// A MongoDB ObjectId; anything else cannot be a list, so it is not worth a request.
const LIST_ID_PATTERN = /^[0-9a-f]{24}$/i

const LOADING = { status: 'loading', list: null }
const NOT_FOUND = { status: 'notFound', list: null }
const FAILED = { status: 'error', list: null }

function useList(id) {
  const isValidId = LIST_ID_PATTERN.test(id)
  const [result, setResult] = useState(isValidId ? LOADING : NOT_FOUND)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!isValidId) return undefined

    const controller = new AbortController()

    api
      .get(`/lists/${id}`, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setResult({ status: 'ready', list: response.data.list })
      })
      .catch((err) => {
        if (!controller.signal.aborted) setResult(err.response?.status === 404 ? NOT_FOUND : FAILED)
      })

    return () => controller.abort()
  }, [id, isValidId, attempt])

  function retry() {
    setResult(LOADING)
    setAttempt((current) => current + 1)
  }

  async function updateList(values) {
    const response = await api.patch(`/lists/${id}`, values)
    setResult({ status: 'ready', list: response.data.list })
  }

  // A list that is already gone counts as deleted.
  async function deleteList() {
    try {
      await api.delete(`/lists/${id}`)
    } catch (err) {
      if (err.response?.status !== 404) throw err
    }
  }

  // Returns false when the list itself is gone, so the page switches to its not-found state.
  async function removeMovie(tmdbId) {
    try {
      await api.delete(`/lists/${id}/movies/${tmdbId}`)
    } catch (err) {
      if (err.response?.status !== 404) throw err
      setResult(NOT_FOUND)
      return false
    }
    setResult((current) => ({
      ...current,
      list: { ...current.list, movies: current.list.movies.filter((movie) => movie.tmdbId !== tmdbId) },
    }))
    return true
  }

  return { ...result, retry, updateList, deleteList, removeMovie }
}

export default useList
