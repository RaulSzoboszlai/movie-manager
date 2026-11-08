import mongoose from 'mongoose';
import { httpError } from '../middleware/errorHandler.js';
import List from '../models/List.js';

const MAX_NAME_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 500;

function parseName(name) {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (trimmed === '') {
        throw httpError(400, 'Name is required');
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
        throw httpError(400, `Name must be at most ${MAX_NAME_LENGTH} characters`);
    }
    return trimmed;
}

function parseDescription(description) {
    if (typeof description !== 'string') {
        throw httpError(400, 'Description must be text');
    }
    const trimmed = description.trim();
    if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
        throw httpError(400, `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
    }
    return trimmed;
}

// A malformed id is reported as a missing list, so the client handles both the same way.
async function findOwnList(id, userId) {
    const list = mongoose.isValidObjectId(id) ? await List.findOne({ _id: id, user: userId }) : null;
    if (!list) {
        throw httpError(404, 'List not found');
    }
    return list;
}

function duplicateNameError(err) {
    return err.code === 11000 ? httpError(409, 'You already have a list with that name') : err;
}

function toListSummary(doc) {
    const { name, description, movies, createdAt, updatedAt } = doc;
    return { id: doc._id.toString(), name, description, movieCount: movies.length, createdAt, updatedAt };
}

function toList(doc) {
    const { name, description, createdAt, updatedAt } = doc;
    const movies = doc.movies.map(({ tmdbId, title, posterPath, addedAt }) => ({ tmdbId, title, posterPath, addedAt }));
    return { id: doc._id.toString(), name, description, movies, createdAt, updatedAt };
}

export async function listLists(req, res) {
    const docs = await List.find({ user: req.userId }).sort({ createdAt: -1, _id: -1 });
    res.json({ lists: docs.map(toListSummary) });
}

export async function createList(req, res) {
    const body = req.body ?? {};
    const name = parseName(body.name);
    const description = body.description === undefined ? '' : parseDescription(body.description);

    try {
        const doc = await List.create({ user: req.userId, name, description });
        res.status(201).json({ list: toList(doc) });
    } catch (err) {
        throw duplicateNameError(err);
    }
}

export async function getList(req, res) {
    const doc = await findOwnList(req.params.id, req.userId);
    res.json({ list: toList(doc) });
}

export async function updateList(req, res) {
    const body = req.body ?? {};
    if (body.name === undefined && body.description === undefined) {
        throw httpError(400, 'Name or description is required');
    }
    const name = body.name === undefined ? undefined : parseName(body.name);
    const description = body.description === undefined ? undefined : parseDescription(body.description);

    const doc = await findOwnList(req.params.id, req.userId);
    if (name !== undefined) doc.name = name;
    if (description !== undefined) doc.description = description;

    try {
        await doc.save();
    } catch (err) {
        throw duplicateNameError(err);
    }
    res.json({ list: toList(doc) });
}

export async function deleteList(req, res) {
    const result = mongoose.isValidObjectId(req.params.id)
        ? await List.deleteOne({ _id: req.params.id, user: req.userId })
        : { deletedCount: 0 };
    if (result.deletedCount === 0) {
        throw httpError(404, 'List not found');
    }
    res.status(204).end();
}
