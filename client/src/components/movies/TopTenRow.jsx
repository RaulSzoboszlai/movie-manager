import MovieCard from './MovieCard.jsx'

// A browser counts a focused link as visible once any of it shows, and each link
// starts with its rank number, so tabbing could focus a card with its poster off-screen.
function revealFocusedCard(event) {
  event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

function TopTenRow({ movies, labelledBy }) {
  return (
    <ol
      aria-labelledby={labelledBy}
      onFocus={revealFocusedCard}
      className="-mx-2 flex list-none scroll-px-2 gap-4 overflow-x-auto px-2 pt-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {movies.map((movie, index) => (
        <li key={movie.tmdbId} className="flex-none">
          <MovieCard movie={movie} rank={index + 1} />
        </li>
      ))}
    </ol>
  )
}

export default TopTenRow
