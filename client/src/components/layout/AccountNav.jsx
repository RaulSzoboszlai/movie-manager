import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'

const LOGOUT_ERROR = 'Could not log out. Please try again.'

const linkBase = 'block rounded-md py-2 text-sm font-medium transition-colors motion-reduce:transition-none'

// Account links use tighter padding on narrow screens so they fit beside the logo at 320px.
const accountPadding = 'px-2 min-[860px]:px-3'

const navClass = 'ml-auto flex min-w-0 items-center gap-1'

function loginClass({ isActive }) {
  const state = isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-raised hover:text-text'
  return `${linkBase} ${accountPadding} ${state}`
}

function registerClass({ isActive }) {
  const state = isActive
    ? 'border-accent bg-accent-soft text-accent'
    : 'border-border-strong text-text hover:border-muted hover:bg-surface-raised'
  return `${linkBase} ${accountPadding} border ${state}`
}

// Mounted only while signed in, so pending and error state cannot outlive the session.
function SignedInAccount({ username, logout }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleLogout() {
    if (pending) return

    setError('')
    setPending(true)
    try {
      await logout()
    } catch {
      setError(LOGOUT_ERROR)
      setPending(false)
    }
  }

  return (
    <>
      <nav aria-label="Account" className={navClass}>
        <span title={username} className="max-w-20 truncate px-2 text-sm text-muted min-[860px]:max-w-48">
          {username}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          aria-disabled={pending}
          className={`${linkBase} ${accountPadding} shrink-0 border border-border-strong text-text hover:border-muted hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60`}
        >
          {pending ? 'Logging out...' : 'Log out'}
        </button>
      </nav>
      <div role="alert" className="order-4 basis-full text-right text-sm text-error empty:hidden">
        {error}
      </div>
    </>
  )
}

function AccountNav() {
  const { status, user, logout } = useAuth()

  if (status === 'loading') {
    return <nav aria-label="Account" className={navClass} />
  }

  if (status === 'authenticated') {
    return <SignedInAccount username={user.username} logout={logout} />
  }

  return (
    <nav aria-label="Account" className={navClass}>
      <NavLink to="/login" className={loginClass}>
        Log in
      </NavLink>
      <NavLink to="/register" className={registerClass}>
        Register
      </NavLink>
    </nav>
  )
}

export default AccountNav
