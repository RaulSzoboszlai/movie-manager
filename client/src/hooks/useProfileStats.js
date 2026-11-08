import { useEffect, useState } from 'react'
import api from '../lib/api.js'

const LOADING = { status: 'loading', stats: null }
const FAILED = { status: 'error', stats: null }

function useProfileStats() {
  const [result, setResult] = useState(LOADING)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    api
      .get('/profile/stats', { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setResult({ status: 'ready', stats: response.data.stats })
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

export default useProfileStats
