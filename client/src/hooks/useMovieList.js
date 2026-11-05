import { useEffect, useState } from 'react'
import api from '../lib/api.js'

const LOADING = { status: 'loading', movies: [] }
const FAILED = { status: 'error', movies: [] }

function useMovieList(path) {
  const [result, setResult] = useState(LOADING)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    api
      .get(path, { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setResult({ status: 'ready', movies: response.data.movies })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult(FAILED)
      })

    return () => controller.abort()
  }, [path, attempt])

  function retry() {
    setResult(LOADING)
    setAttempt((current) => current + 1)
  }

  return { ...result, retry }
}

export default useMovieList
