import { useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import AccountNav from './AccountNav.jsx'

const mainLinks = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
  { to: '/library', label: 'Library' },
  { to: '/lists', label: 'Lists' },
  { to: '/profile', label: 'Profile' },
]

// Taller rows in the mobile menu give each link a comfortable tap target.
const linkBase =
  'block rounded-md py-2.5 text-sm font-medium transition-colors motion-reduce:transition-none min-[860px]:py-2'

function mainLinkClass({ isActive }) {
  const state = isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-raised hover:text-text'
  return `${linkBase} px-3 ${state}`
}

function MenuIcon({ open }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-5"
    >
      {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  )
}

function Navbar() {
  const location = useLocation()
  const panelId = useId()
  const buttonRef = useRef(null)
  // The menu belongs to the location it was opened on, so any navigation closes it.
  const [openKey, setOpenKey] = useState(null)
  const open = openKey === location.key

  function close() {
    setOpenKey(null)
  }

  function handleKeyDown(event) {
    if (event.key !== 'Escape' || !open) return
    close()
    buttonRef.current.focus()
  }

  return (
    <header className="border-b border-border bg-surface">
      <div
        onKeyDown={handleKeyDown}
        className="mx-auto flex w-full max-w-304 flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 min-[860px]:flex-nowrap min-[860px]:gap-x-6 min-[860px]:px-6"
      >
        <Link to="/" className="text-xl font-bold">
          Movie<span className="text-gradient inline-block">Manager</span>
        </Link>

        <button
          ref={buttonRef}
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpenKey(open ? null : location.key)}
          className="ml-auto inline-flex size-10 items-center justify-center rounded-md border border-border-strong text-text transition-colors hover:bg-surface-raised motion-reduce:transition-none min-[860px]:hidden"
        >
          <MenuIcon open={open} />
        </button>

        <div
          id={panelId}
          className={`${open ? 'flex' : 'hidden'} basis-full flex-col gap-3 border-t border-border pt-3 min-[860px]:flex min-[860px]:flex-1 min-[860px]:basis-auto min-[860px]:flex-row min-[860px]:flex-wrap min-[860px]:items-center min-[860px]:gap-x-6 min-[860px]:gap-y-2 min-[860px]:border-t-0 min-[860px]:pt-0`}
        >
          <nav aria-label="Main">
            <ul className="flex flex-col gap-1 min-[860px]:flex-row min-[860px]:flex-wrap">
              {mainLinks.map(({ to, label }) => (
                <li key={to}>
                  <NavLink to={to} end={to === '/'} onClick={close} className={mainLinkClass}>
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <AccountNav />
        </div>
      </div>
    </header>
  )
}

export default Navbar
