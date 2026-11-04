import { Link, NavLink } from 'react-router-dom'
import AccountNav from './AccountNav.jsx'

const mainLinks = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
  { to: '/library', label: 'Library' },
  { to: '/lists', label: 'Lists' },
  { to: '/profile', label: 'Profile' },
]

const linkBase = 'block rounded-md py-2 text-sm font-medium transition-colors motion-reduce:transition-none'

function mainLinkClass({ isActive }) {
  const state = isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-raised hover:text-text'
  return `${linkBase} px-3 ${state}`
}

function Navbar() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-304 flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 min-[860px]:gap-x-6 min-[860px]:px-6">
        <Link to="/" className="text-xl font-bold">
          Movie<span className="text-accent">Manager</span>
        </Link>

        <nav aria-label="Main" className="order-3 basis-full min-[860px]:order-none min-[860px]:basis-auto">
          <ul className="flex flex-wrap gap-1">
            {mainLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink to={to} end={to === '/'} className={mainLinkClass}>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <AccountNav />
      </div>
    </header>
  )
}

export default Navbar
