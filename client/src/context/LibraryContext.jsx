import { LibraryContext } from '../hooks/useLibrary.js'
import useMovieList from '../hooks/useMovieList.js'
import api from '../lib/api.js'

export function LibraryProvider({ children }) {
  const { status, movies, retry, setMovies } = useMovieList('/library')

  async function add({ tmdbId, title, posterPath, releaseYear, genreIds }, status) {
    const response = await api.post('/library', { tmdbId, title, posterPath, releaseYear, genreIds, status })
    const saved = response.data.movie
    setMovies((current) => [saved, ...current.filter((movie) => movie.tmdbId !== saved.tmdbId)])
  }

  async function update(tmdbId, changes) {
    const response = await api.patch(`/library/${tmdbId}`, changes)
    const saved = response.data.movie
    setMovies((current) => current.map((movie) => (movie.tmdbId === saved.tmdbId ? saved : movie)))
  }

  async function remove(tmdbId) {
    await api.delete(`/library/${tmdbId}`)
    setMovies((current) => current.filter((movie) => movie.tmdbId !== tmdbId))
  }

  return (
    <LibraryContext.Provider value={{ status, movies, retry, add, update, remove }}>{children}</LibraryContext.Provider>
  )
}
