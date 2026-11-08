import { useEffect, useState } from 'react'
import api from '../lib/api.js'

const LOADING = { status: 'loading', lists: [] }
const FAILED = { status: 'error', lists: [] }

function toSummary({ movies, ...list }) {
  return { ...list, movieCount: movies.length }
}

function useLists() {
  const [result, setResult] = useState(LOADING)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    api
      .get('/lists', { signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setResult({ status: 'ready', lists: response.data.lists })
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

  async function createList(values) {
    const response = await api.post('/lists', values)
    const created = toSummary(response.data.list)
    setResult((current) => ({ ...current, lists: [created, ...current.lists] }))
  }

  return { ...result, retry, createList }
}

export default useLists
