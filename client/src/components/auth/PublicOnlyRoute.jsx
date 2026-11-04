import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'

function PublicOnlyRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <p role="status" className="text-muted">
        Checking your session...
      </p>
    )
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default PublicOnlyRoute
