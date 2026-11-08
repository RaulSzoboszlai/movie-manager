import AddToListButton from '../lists/AddToListButton.jsx'
import useLibrary from '../../hooks/useLibrary.js'
import StarRating from './StarRating.jsx'
import WatchedButton from './WatchedButton.jsx'
import WatchlistButton from './WatchlistButton.jsx'

function LibraryControls({ movie, alwaysShowRating = false, compact = false }) {
  const { status, movies } = useLibrary()

  const ready = status === 'ready'
  const saved = movies.find((savedMovie) => savedMovie.tmdbId === movie.tmdbId)
  const watched = ready && saved?.status === 'watched'

  // WatchedButton keeps its place in the tree across states, so the same DOM button
  // survives the press and keeps keyboard focus when the watchlist button goes away.
  return (
    <div className="flex flex-col gap-2">
      <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {!watched && <WatchlistButton movie={movie} compact={compact} />}
        {ready && <WatchedButton movie={movie} compact={compact} />}
        <AddToListButton movie={movie} compact={compact} />
      </div>
      {ready && (watched || alwaysShowRating) && <StarRating movie={movie} />}
    </div>
  )
}

export default LibraryControls
