const { TMDB_API_KEY } = process.env;

const BASE_URL = 'https://api.themoviedb.org/3';
const REQUEST_TIMEOUT_MS = 8000;
const TRENDING_LIMIT = 10;

/** TMDB rejects any page above this, whatever its total_pages says. */
export const MAX_PAGE = 500;

// Errors stay free of the URL (it holds the key) and of any HTTP status: the
// central handler would forward a TMDB 401 and the client would sign the user out.
async function tmdbGet(path, params = {}) {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set('api_key', TMDB_API_KEY);
    for (const [name, value] of Object.entries(params)) {
        url.searchParams.set(name, value);
    }

    let response;
    let body;
    try {
        response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
        body = response.ok ? await response.json() : null;
    } catch (err) {
        throw new Error(`TMDB request to ${path} failed: ${err.name}`);
    }

    if (!response.ok) {
        throw new Error(`TMDB request to ${path} failed: HTTP ${response.status}`);
    }
    return body;
}

function isValidMovie(result) {
    return Number.isInteger(result?.id) && result.id > 0 && typeof result.title === 'string' && result.title !== '';
}

function toMovieSummary(result) {
    const { id, title, poster_path: posterPath, release_date: releaseDate, genre_ids: genreIds } = result;
    const year = typeof releaseDate === 'string' ? releaseDate.match(/^\d{4}/) : null;

    return {
        tmdbId: id,
        title,
        posterPath: typeof posterPath === 'string' && posterPath.startsWith('/') ? posterPath : null,
        releaseYear: year ? Number(year[0]) : null,
        genreIds: Array.isArray(genreIds) ? genreIds.filter(Number.isInteger) : [],
    };
}

function parseMovieSummaries(body, path) {
    if (!Array.isArray(body?.results)) {
        throw new Error(`TMDB response from ${path} has no results array`);
    }

    return body.results.filter(isValidMovie).map(toMovieSummary);
}

async function fetchMovieSummaries(path) {
    const body = await tmdbGet(path);
    return parseMovieSummaries(body, path);
}

export async function getTrendingMovies() {
    const movies = await fetchMovieSummaries('/trending/movie/week');
    return movies.slice(0, TRENDING_LIMIT);
}

export function getPopularMovies() {
    return fetchMovieSummaries('/movie/popular');
}

export function getTopRatedMovies() {
    return fetchMovieSummaries('/movie/top_rated');
}

export function getUpcomingMovies() {
    return fetchMovieSummaries('/movie/upcoming');
}

export async function searchMovies(query, page) {
    const path = '/search/movie';
    const body = await tmdbGet(path, { query, page });
    const movies = parseMovieSummaries(body, path);

    const totalPages = body.total_pages;
    if (!Number.isInteger(totalPages) || totalPages < 0) {
        throw new Error(`TMDB response from ${path} has no valid total_pages`);
    }

    return { movies, page, totalPages: Math.min(totalPages, MAX_PAGE) };
}

function isValidGenre(genre) {
    return Number.isInteger(genre?.id) && typeof genre.name === 'string' && genre.name !== '';
}

async function fetchGenreMap() {
    const path = '/genre/movie/list';
    const body = await tmdbGet(path);
    const genres = Array.isArray(body?.genres) ? body.genres.filter(isValidGenre) : [];
    if (genres.length === 0) {
        throw new Error(`TMDB response from ${path} has no valid genres`);
    }

    return new Map(genres.map(({ id, name }) => [id, name]));
}

let genreMapPromise = null;

/** Resolves to a Map of TMDB genre id to name, cached until the process restarts. */
export function getGenreMap() {
    genreMapPromise ??= fetchGenreMap().catch((err) => {
        genreMapPromise = null;
        throw err;
    });
    return genreMapPromise;
}
