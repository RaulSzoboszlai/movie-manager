import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

// Returns showToast(message), which shows a short success confirmation.
function useToast() {
  return useContext(ToastContext)
}

export default useToast
