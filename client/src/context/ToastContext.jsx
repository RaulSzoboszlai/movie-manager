import { useCallback, useRef, useState } from 'react'
import Toaster from '../components/feedback/Toaster.jsx'
import useAuth from '../hooks/useAuth.js'
import { ToastContext } from '../hooks/useToast.js'

const MAX_TOASTS = 3

export function ToastProvider({ children }) {
  const { status } = useAuth()
  const [toasts, setToasts] = useState([])
  const [previousStatus, setPreviousStatus] = useState(status)
  const nextId = useRef(0)

  // Movie and list names must not linger on screen after the session ends.
  if (status !== previousStatus) {
    setPreviousStatus(status)
    if (previousStatus === 'authenticated') setToasts([])
  }

  const showToast = useCallback((message) => {
    nextId.current += 1
    const toast = { id: nextId.current, message }
    setToasts((current) => [...current, toast].slice(-MAX_TOASTS))
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
