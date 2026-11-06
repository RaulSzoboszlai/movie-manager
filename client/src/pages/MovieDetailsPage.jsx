import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import MovieDetails from '../components/movies/MovieDetails.jsx'

function MovieDetailsPage() {
  const { tmdbId } = useParams()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tmdbId])

  return <MovieDetails key={tmdbId} tmdbId={tmdbId} />
}

export default MovieDetailsPage
