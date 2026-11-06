import { LibraryContext } from '../hooks/useLibrary.js'
import useMovieList from '../hooks/useMovieList.js'
import api from '../lib/api.js'

export function LibraryProvider({ children }) {
  const { status, movies, retry, setMovies } = useMovieList('/library')

  async function add({ tmdbId, title, posterPath, releaseYear, genreIds }) {
    const response = await api.post('/library', { tmdbId, title, posterPath, releaseYear, genreIds })
    const saved = response.data.movie
    setMovies((current) => [saved, ...current.filter((movie) => movie.tmdbId !== saved.tmdbId)])
  }

  async function remove(tmdbId) {
    await api.delete(`/library/${tmdbId}`)
    setMovies((current) => current.filter((movie) => movie.tmdbId !== tmdbId))
  }

  return (
    <LibraryContext.Provider value={{ status, movies, retry, add, remove }}>{children}</LibraryContext.Provider>
  )
}
