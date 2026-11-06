import { httpError } from '../middleware/errorHandler.js';
import SavedMovie from '../models/SavedMovie.js';
import { parseTmdbId } from './movieController.js';

const MAX_RELEASE_YEAR = 9999;
const STATUSES = ['want', 'watched'];

function parseStatus(status) {
    if (status === undefined || status === '') {
        return null;
    }
    // A repeated parameter arrives as an array, which includes() rejects too.
    if (!STATUSES.includes(status)) {
        throw httpError(400, 'Status must be want or watched');
    }
    return status;
}

// Bodies are strict, unlike the query string: an empty status is a bad request, not "unset".
function requireStatus(status) {
    if (!STATUSES.includes(status)) {
        throw httpError(400, 'Status must be want or watched');
    }
    return status;
}

function requireRating(rating) {
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
        throw httpError(400, 'Rating must be a whole number from 1 to 5');
    }
    return rating;
}

function parseSnapshot(body) {
    const { title, genreIds } = body;
    const tmdbId = parseTmdbId(typeof body.tmdbId === 'number' ? String(body.tmdbId) : '');
    const posterPath = body.posterPath ?? null;
    const releaseYear = body.releaseYear ?? null;

    if (typeof title !== 'string' || title === '') {
        throw httpError(400, 'Title is required');
    }
    if (posterPath !== null && (typeof posterPath !== 'string' || !posterPath.startsWith('/'))) {
        throw httpError(400, 'Poster path must be a TMDB image path');
    }
    if (releaseYear !== null && (!Number.isInteger(releaseYear) || releaseYear < 0 || releaseYear > MAX_RELEASE_YEAR)) {
        throw httpError(400, 'Release year must be a four-digit year');
    }
    if (!Array.isArray(genreIds) || !genreIds.every(Number.isInteger)) {
        throw httpError(400, 'Genre ids must be a list of TMDB genre ids');
    }

    return { tmdbId, title, posterPath, releaseYear, genreIds };
}

function toSavedMovie(doc) {
    const { tmdbId, title, posterPath, releaseYear, genreIds, status, rating, watchedAt, createdAt } = doc;
    return { tmdbId, title, posterPath, releaseYear, genreIds, status, rating, watchedAt, createdAt };
}

export async function listLibrary(req, res) {
    const status = parseStatus(req.query.status);
    const filter = status === null ? { user: req.userId } : { user: req.userId, status };

    const docs = await SavedMovie.find(filter).sort({ createdAt: -1, _id: -1 });
    res.json({ movies: docs.map(toSavedMovie) });
}

export async function addToLibrary(req, res) {
    const body = req.body ?? {};
    const snapshot = parseSnapshot(body);
    const status = body.status === undefined ? 'want' : requireStatus(body.status);
    const watchedAt = status === 'watched' ? new Date() : null;

    try {
        const doc = await SavedMovie.create({ ...snapshot, user: req.userId, status, watchedAt });
        res.status(201).json({ movie: toSavedMovie(doc) });
    } catch (err) {
        if (err.code !== 11000) {
            throw err;
        }
        // Already saved: never overwrite the snapshot or reset a watched movie.
        const doc = await SavedMovie.findOne({ user: req.userId, tmdbId: snapshot.tmdbId });
        if (!doc) {
            throw err;
        }
        res.json({ movie: toSavedMovie(doc) });
    }
}

export async function updateLibraryMovie(req, res) {
    const tmdbId = parseTmdbId(req.params.tmdbId);
    const { status, rating } = req.body ?? {};

    if (status === undefined && rating === undefined) {
        throw httpError(400, 'Status or rating is required');
    }
    if (status !== undefined) requireStatus(status);
    if (rating !== undefined) requireRating(rating);

    const doc = await SavedMovie.findOne({ user: req.userId, tmdbId });
    if (!doc) {
        throw httpError(404, 'Movie not in library');
    }

    const nextStatus = status ?? doc.status;
    // Checked here because the model's rule surfaces as a ValidationError, which would be a 500.
    if (rating !== undefined && rating !== null && nextStatus !== 'watched') {
        throw httpError(400, 'Rating is only allowed on a watched movie');
    }

    if (nextStatus === 'want') {
        doc.rating = null;
        doc.watchedAt = null;
    } else {
        if (doc.status !== 'watched') doc.watchedAt = new Date();
        if (rating !== undefined) doc.rating = rating;
    }
    doc.status = nextStatus;

    // save(), not a query update, so the model's rating rule still runs (F-15).
    await doc.save();
    res.json({ movie: toSavedMovie(doc) });
}

export async function removeFromLibrary(req, res) {
    const tmdbId = parseTmdbId(req.params.tmdbId);
    await SavedMovie.deleteOne({ user: req.userId, tmdbId });
    res.status(204).end();
}
