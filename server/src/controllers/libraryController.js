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
    const snapshot = parseSnapshot(req.body ?? {});

    try {
        const doc = await SavedMovie.create({ ...snapshot, user: req.userId, status: 'want' });
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

export async function removeFromLibrary(req, res) {
    const tmdbId = parseTmdbId(req.params.tmdbId);
    await SavedMovie.deleteOne({ user: req.userId, tmdbId });
    res.status(204).end();
}
