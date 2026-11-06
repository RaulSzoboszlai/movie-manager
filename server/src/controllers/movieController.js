import { httpError } from '../middleware/errorHandler.js';
import {
    getGenreMap,
    getPopularMovies,
    getTopRatedMovies,
    getTrendingMovies,
    getUpcomingMovies,
    MAX_PAGE,
    searchMovies,
} from '../services/tmdb.js';

const SEARCH_REQUIRED_MESSAGE = 'A search query or filter is required';

function parseSearchQuery(q) {
    if (q === undefined) {
        return '';
    }
    // A repeated parameter arrives as an array.
    if (typeof q !== 'string') {
        throw httpError(400, SEARCH_REQUIRED_MESSAGE);
    }
    return q.trim();
}

/** Resolves to a number, or null when the filter is unset. */
function parseFilter(value, pattern, message) {
    if (value === undefined || value === '') {
        return null;
    }
    if (typeof value !== 'string' || !pattern.test(value)) {
        throw httpError(400, message);
    }
    return Number(value);
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
    const genre = parseFilter(req.query.genre, /^[1-9]\d{0,8}$/, 'Genre must be a TMDB genre id');
    const year = parseFilter(req.query.year, /^(19|20)\d{2}$/, 'Year must be a four-digit year from 1900 to 2099');
    if (query === '' && genre === null && year === null) {
        throw httpError(400, SEARCH_REQUIRED_MESSAGE);
    }

    const page = parsePage(req.query.page);
    res.json(await searchMovies({ query, genre, year, page }));
}

export async function genres(req, res) {
    const genreMap = await getGenreMap();
    const list = [...genreMap]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    res.json({ genres: list });
}
