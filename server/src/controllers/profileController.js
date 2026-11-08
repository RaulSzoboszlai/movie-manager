import mongoose from 'mongoose';
import List from '../models/List.js';
import SavedMovie from '../models/SavedMovie.js';
import { getGenreMap } from '../services/tmdb.js';

const RATINGS = [1, 2, 3, 4, 5];
const TOP_GENRE_LIMIT = 3;

function libraryStats(userId) {
    return SavedMovie.aggregate([
        // aggregate() skips Mongoose casting, so a string id would match nothing.
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
            $facet: {
                statuses: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                ratings: [
                    { $match: { rating: { $ne: null } } },
                    { $group: { _id: '$rating', count: { $sum: 1 } } },
                ],
                genres: [
                    // The library only checks ids are integers, so a repeated id would count twice.
                    { $project: { genreIds: { $setUnion: ['$genreIds', []] } } },
                    { $unwind: '$genreIds' },
                    { $group: { _id: '$genreIds', count: { $sum: 1 } } },
                ],
            },
        },
    ]);
}

function countFor(groups, key) {
    return groups.find((group) => group._id === key)?.count ?? 0;
}

function toRatingStats(ratings) {
    const ratingDistribution = RATINGS.map((rating) => ({ rating, count: countFor(ratings, rating) }));
    const ratedCount = ratingDistribution.reduce((sum, bucket) => sum + bucket.count, 0);
    const total = ratingDistribution.reduce((sum, bucket) => sum + bucket.rating * bucket.count, 0);
    const averageRating = ratedCount === 0 ? null : Math.round((total / ratedCount) * 10) / 10;
    return { ratedCount, averageRating, ratingDistribution };
}

// Ids missing from TMDB's genre list are dropped rather than shown unnamed.
function toTopGenres(genres, genreMap) {
    return genres
        .filter((genre) => genreMap.has(genre._id))
        .map((genre) => ({ id: genre._id, name: genreMap.get(genre._id), count: genre.count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, TOP_GENRE_LIMIT);
}

export async function stats(req, res) {
    const [[library], listCount, genreMap] = await Promise.all([
        libraryStats(req.userId),
        List.countDocuments({ user: req.userId }),
        getGenreMap(),
    ]);

    res.json({
        stats: {
            watchedCount: countFor(library.statuses, 'watched'),
            watchlistCount: countFor(library.statuses, 'want'),
            ...toRatingStats(library.ratings),
            topGenres: toTopGenres(library.genres, genreMap),
            listCount,
        },
    });
}
