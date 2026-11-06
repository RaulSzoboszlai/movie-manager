import { Navigate, Outlet } from 'react-router-dom'
import { LibraryProvider } from '../../context/LibraryContext.jsx'
import useAuth from '../../hooks/useAuth.js'

function ProtectedRoute() {
  const { status, retrySession } = useAuth()

  if (status === 'loading') {
    return (
      <p role="status" className="text-muted">
        Checking your session...
      </p>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />
  }

  if (status === 'error') {
    return (
      <div role="alert">
        <p className="text-error">We couldn&apos;t check your session.</p>
        <button
          type="button"
          onClick={retrySession}
          className="mt-4 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <LibraryProvider>
      <Outlet />
    </LibraryProvider>
  )
}

export default ProtectedRoute
