import {
    getPopularMovies,
    getTopRatedMovies,
    getTrendingMovies,
    getUpcomingMovies,
} from '../services/tmdb.js';

export async function trending(req, res) {
    const movies = await getTrendingMovies();
    res.json({ movies });
}

export async function popular(req, res) {
    const movies = await getPopularMovies();
    res.json({ movies });
}

export async function topRated(req, res) {
    const movies = await getTopRatedMovies();
    res.json({ movies });
}

export async function upcoming(req, res) {
    const movies = await getUpcomingMovies();
    res.json({ movies });
}
