import { useEffect, useState } from 'react'
import api from '../lib/api.js'

const LOADING = { status: 'loading', genres: [] }
const FAILED = { status: 'error', genres: [] }

function useGenres() {
  const [result, setResult] = useState(LOADING)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    api
      .get('/movies/genres', { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setResult({ status: 'ready', genres: response.data.genres })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult(FAILED)
      })

    return () => controller.abort()
  }, [attempt])

  function retry() {
    setResult(LOADING)
    setAttempt((current) => current + 1)
  }

  return { ...result, retry }
}

export default useGenres
