import { useEffect, useState } from 'react'
import { AuthContext } from '../hooks/useAuth.js'
import api from '../lib/api.js'

const LOADING = { status: 'loading', user: null }
const ANONYMOUS = { status: 'anonymous', user: null }
const SESSION_ERROR = { status: 'error', user: null }

function authenticated(user) {
  return { status: 'authenticated', user }
}

function isUnauthorized(err) {
  return err.response?.status === 401
}

async function fetchSession(signal) {
  try {
    const response = await api.get('/auth/me', { signal })
    return authenticated(response.data.user)
  } catch (err) {
    return isUnauthorized(err) ? ANONYMOUS : SESSION_ERROR
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(LOADING)

  useEffect(() => {
    const interceptor = api.interceptors.response.use(undefined, (err) => {
      if (isUnauthorized(err) && err.config?.url !== '/auth/login') {
        setSession(ANONYMOUS)
      }
      return Promise.reject(err)
    })

    const controller = new AbortController()
    fetchSession(controller.signal).then((next) => {
      if (!controller.signal.aborted) setSession(next)
    })

    // A page restored from the back-forward cache keeps its old session state,
    // even if the user logged out after leaving it.
    function handlePageShow(event) {
      if (!event.persisted) return
      setSession(LOADING)
      fetchSession(controller.signal).then((next) => {
        if (!controller.signal.aborted) setSession(next)
      })
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      controller.abort()
      api.interceptors.response.eject(interceptor)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  async function login(body) {
    const response = await api.post('/auth/login', body)
    setSession(authenticated(response.data.user))
  }

  async function register(body) {
    const response = await api.post('/auth/register', body)
    setSession(authenticated(response.data.user))
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      if (!isUnauthorized(err)) throw err
    }
    setSession(ANONYMOUS)
  }

  async function retrySession() {
    setSession(LOADING)
    setSession(await fetchSession())
  }

  return (
    <AuthContext.Provider value={{ ...session, login, register, logout, retrySession }}>
      {children}
    </AuthContext.Provider>
  )
}
