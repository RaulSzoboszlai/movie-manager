const { TMDB_API_KEY } = process.env;

const BASE_URL = 'https://api.themoviedb.org/3';
const REQUEST_TIMEOUT_MS = 8000;
const TRENDING_LIMIT = 10;
const CAST_LIMIT = 12;

/** TMDB rejects any page above this, whatever its total_pages says. */
export const MAX_PAGE = 500;

// Errors stay free of the URL (it holds the key) and never set `status`: the central
// handler would forward a TMDB 401 and the client would sign the user out. Callers
// that need TMDB's status read `tmdbStatus`, which the handler ignores.
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
        throw Object.assign(new Error(`TMDB request to ${path} failed: HTTP ${response.status}`), {
            tmdbStatus: response.status,
        });
    }
    return body;
}

function isValidMovie(result) {
    return Number.isInteger(result?.id) && result.id > 0 && typeof result.title === 'string' && result.title !== '';
}

function parseImagePath(path) {
    return typeof path === 'string' && path.startsWith('/') ? path : null;
}

function toMovieSummary(result) {
    const { id, title, poster_path: posterPath, release_date: releaseDate, genre_ids: genreIds } = result;
    const year = typeof releaseDate === 'string' ? releaseDate.match(/^\d{4}/) : null;

    return {
        tmdbId: id,
        title,
        posterPath: parseImagePath(posterPath),
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

async function fetchMoviePage(path, params, page) {
    const body = await tmdbGet(path, { ...params, page });
    const movies = parseMovieSummaries(body, path);

    const totalPages = body.total_pages;
    if (!Number.isInteger(totalPages) || totalPages < 0) {
        throw new Error(`TMDB response from ${path} has no valid total_pages`);
    }

    return { movies, page, totalPages: Math.min(totalPages, MAX_PAGE) };
}

/**
 * `query` is '' and `genre` and `year` are null when unset. TMDB's text search can't
 * filter by genre, so a text search filters each page here: `page` and `totalPages`
 * still count TMDB's pages, and `movies` can be empty while more pages remain.
 */
export async function searchMovies({ query, genre, year, page }) {
    const yearParam = year === null ? {} : { primary_release_year: year };

    if (query === '') {
        const genreParam = genre === null ? {} : { with_genres: genre };
        return fetchMoviePage('/discover/movie', { ...genreParam, ...yearParam }, page);
    }

    const result = await fetchMoviePage('/search/movie', { query, ...yearParam }, page);
    if (genre === null) {
        return result;
    }
    return { ...result, movies: result.movies.filter((movie) => movie.genreIds.includes(genre)) };
}

function isValidGenre(genre) {
    return Number.isInteger(genre?.id) && typeof genre.name === 'string' && genre.name !== '';
}

function parseReleaseDate(date) {
    return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date))
        ? date
        : null;
}

function isValidCastMember(member) {
    return (
        Number.isInteger(member?.id) && member.id > 0 && typeof member.name === 'string' && member.name !== ''
    );
}

function parseCast(cast) {
    if (!Array.isArray(cast)) {
        return [];
    }

    // One actor can hold two credits on a film, and the client keys cards by person id.
    const seen = new Set();
    const members = cast.filter(isValidCastMember).filter(({ id }) => {
        if (seen.has(id)) {
            return false;
        }
        seen.add(id);
        return true;
    });

    return members.slice(0, CAST_LIMIT).map(({ id, name, character, profile_path: profilePath }) => ({
        id,
        name,
        character: typeof character === 'string' ? character : '',
        profilePath: parseImagePath(profilePath),
    }));
}

function parseTrailerKey(videos) {
    if (!Array.isArray(videos)) {
        return null;
    }

    // The key is placed in an iframe URL on the client.
    const trailers = videos.filter(
        (video) =>
            video?.site === 'YouTube' &&
            video.type === 'Trailer' &&
            typeof video.key === 'string' &&
            /^[\w-]+$/.test(video.key),
    );
    const trailer = trailers.find((video) => video.official === true) ?? trailers[0];
    return trailer ? trailer.key : null;
}

function toMovieDetails(result) {
    const { id, title, overview, poster_path, backdrop_path, release_date, runtime, genres, credits, videos } = result;

    return {
        tmdbId: id,
        title,
        overview: typeof overview === 'string' ? overview : '',
        posterPath: parseImagePath(poster_path),
        backdropPath: parseImagePath(backdrop_path),
        releaseDate: parseReleaseDate(release_date),
        runtime: Number.isInteger(runtime) && runtime > 0 ? runtime : null,
        genres: Array.isArray(genres) ? genres.filter(isValidGenre).map(({ id, name }) => ({ id, name })) : [],
        cast: parseCast(credits?.cast),
        trailerKey: parseTrailerKey(videos?.results),
    };
}

/** Resolves to the movie's details, or null when TMDB has no movie with this id. */
export async function getMovieDetails(tmdbId) {
    const path = `/movie/${tmdbId}`;

    let body;
    try {
        body = await tmdbGet(path, { append_to_response: 'credits,videos' });
    } catch (err) {
        if (err.tmdbStatus === 404) {
            return null;
        }
        throw err;
    }

    if (!isValidMovie(body)) {
        throw new Error(`TMDB response from ${path} is not a valid movie`);
    }
    return toMovieDetails(body);
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
