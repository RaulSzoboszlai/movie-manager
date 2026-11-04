import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight min-[860px]:text-4xl">Page not found</h1>
      <p className="mt-1 text-muted">
        This page does not exist.{' '}
        <Link to="/" className="text-accent underline underline-offset-2 hover:text-accent-hover">
          Go back home
        </Link>
      </p>
    </>
  )
}

export default NotFoundPage
