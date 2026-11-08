import mongoose from 'mongoose';

const listMovieSchema = new mongoose.Schema(
    {
        tmdbId: { type: Number, required: true },
        title: { type: String },
        posterPath: { type: String, default: null },
        addedAt: { type: Date, default: Date.now },
    },
    { _id: false },
);

const listSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        movies: { type: [listMovieSchema], default: [] },
    },
    { timestamps: true },
);

// Strength 2 ignores case but not accents, so "Horror nights" and "horror nights" collide.
listSchema.index({ user: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('List', listSchema);
