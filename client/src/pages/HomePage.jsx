import MovieSection from '../components/movies/MovieSection.jsx'

const ROWS = [
  { path: '/movies/popular', heading: 'Popular', noun: 'popular' },
  { path: '/movies/top-rated', heading: 'Top rated', noun: 'top rated' },
  { path: '/movies/upcoming', heading: 'Upcoming', noun: 'upcoming' },
]

function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">Home</h1>

      <MovieSection
        path="/movies/trending"
        heading="Top 10 trending"
        noun="trending"
        subheading="What people are watching this week."
        ranked
      />

      {ROWS.map((row) => (
        <MovieSection key={row.path} {...row} />
      ))}
    </div>
  )
}

export default HomePage
