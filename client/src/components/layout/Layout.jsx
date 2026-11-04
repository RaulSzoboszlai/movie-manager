import { Outlet } from 'react-router-dom'
import Footer from './Footer.jsx'
import Navbar from './Navbar.jsx'

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col pt-8 pb-12">
        <div className="mx-auto flex w-full max-w-304 flex-1 flex-col px-4 min-[860px]:px-6">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Layout
