import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true, select: false },
    },
    { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model('User', userSchema);
