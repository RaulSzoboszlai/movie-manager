import mongoose from 'mongoose';

const savedMovieSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        tmdbId: { type: Number, required: true },
        title: { type: String },
        posterPath: { type: String, default: null },
        releaseYear: { type: Number, default: null },
        genreIds: { type: [Number] },
        status: { type: String, enum: ['want', 'watched'], required: true },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
            validate: {
                validator: (value) => value === null || Number.isInteger(value),
                message: 'Rating must be a whole number',
            },
        },
        watchedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

savedMovieSchema.index({ user: 1, tmdbId: 1 }, { unique: true });

// Checked on the document so it holds whichever of the two fields changes.
savedMovieSchema.pre('validate', function () {
    if (this.rating !== null && this.status !== 'watched') {
        this.invalidate('rating', 'Rating is only allowed on a watched movie');
    }
});

export default mongoose.model('SavedMovie', savedMovieSchema);
