import MovieCard from './MovieCard.jsx'

// A browser counts a focused link as visible once any of it shows, so tabbing could
// focus a card with most of it off-screen, or only the rank number of a ranked card.
function revealFocusedCard(event) {
  event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

function MovieRow({ movies, labelledBy, ranked = false }) {
  const List = ranked ? 'ol' : 'ul'

  return (
    <List
      aria-labelledby={labelledBy}
      onFocus={revealFocusedCard}
      className="-mx-2 flex list-none scroll-px-2 gap-4 overflow-x-auto px-2 pt-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {movies.map((movie, index) => (
        <li key={movie.tmdbId} className="flex-none">
          <MovieCard movie={movie} rank={ranked ? index + 1 : undefined} />
        </li>
      ))}
    </List>
  )
}

export default MovieRow
