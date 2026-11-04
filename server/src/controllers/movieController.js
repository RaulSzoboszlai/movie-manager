import { getTrendingMovies } from '../services/tmdb.js';

export async function trending(req, res) {
    const movies = await getTrendingMovies();
    res.json({ movies });
}
