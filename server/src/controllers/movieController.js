import { httpError } from '../middleware/errorHandler.js';
import {
    getPopularMovies,
    getTopRatedMovies,
    getTrendingMovies,
    getUpcomingMovies,
    MAX_PAGE,
    searchMovies,
} from '../services/tmdb.js';

function parseSearchQuery(q) {
    const query = typeof q === 'string' ? q.trim() : '';
    if (query === '') {
        throw httpError(400, 'Search query is required');
    }
    return query;
}

function parsePage(page) {
    if (page === undefined) {
        return 1;
    }

    const value = typeof page === 'string' && /^\d+$/.test(page) ? Number(page) : 0;
    if (value < 1 || value > MAX_PAGE) {
        throw httpError(400, `Page must be a whole number from 1 to ${MAX_PAGE}`);
    }
    return value;
}

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

export async function search(req, res) {
    const query = parseSearchQuery(req.query.q);
    const page = parsePage(req.query.page);
    res.json(await searchMovies(query, page));
}
