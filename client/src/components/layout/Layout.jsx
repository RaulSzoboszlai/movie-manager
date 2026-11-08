import { Outlet } from 'react-router-dom'
import Footer from './Footer.jsx'
import Navbar from './Navbar.jsx'

// Focus moves without a hash in the URL, so the router's location stays clean.
function skipToMain(event) {
  event.preventDefault()
  document.getElementById('main-content').focus()
}

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        onClick={skipToMain}
        className="sr-only z-50 rounded-md border border-border-strong bg-surface-raised px-4 py-2 text-sm font-medium text-text shadow-soft focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col pt-8 pb-12 outline-none">
        <div className="mx-auto flex w-full max-w-304 flex-1 flex-col px-4 min-[860px]:px-6">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Layout
