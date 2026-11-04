function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-6 text-xs text-muted">
      <div className="mx-auto w-full max-w-304 px-4 min-[860px]:px-6">
        <p>
          This product uses the TMDB API but is not endorsed or certified by TMDB.{' '}
          <a href="https://www.themoviedb.org/" className="text-text underline underline-offset-2">
            themoviedb.org
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer
