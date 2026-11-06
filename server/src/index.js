import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import libraryRoutes from './routes/library.js';
import movieRoutes from './routes/movies.js';

const missing = ['MONGO_URI', 'CLIENT_URL', 'JWT_SECRET', 'TMDB_API_KEY'].filter((name) => !process.env[name]);
if (missing.length > 0) {
    console.error(
        `Missing required environment variables: ${missing.join(', ')}. ` +
            'Use npm run dev to load server/.env, or set them in the environment.',
    );
    process.exit(1);
}

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({
    origin: (origin, callback) => callback(null, origin === process.env.CLIENT_URL),
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/library', libraryRoutes);

app.use(notFound);
app.use(errorHandler);

try {
    await mongoose.connect(process.env.MONGO_URI);
} catch (err) {
    console.error(`Could not connect to MongoDB (${err.name}). Check that it is running and that MONGO_URI is correct.`);
    process.exit(1);
}
console.log('Connected to MongoDB');

app.listen(PORT, (err) => {
    if (err) {
        console.error(`Could not start the server on port ${PORT}: ${err.message}`);
        process.exit(1);
    }
    console.log(`Server is running on port ${PORT}`);
});
