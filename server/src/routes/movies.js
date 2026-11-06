import { Router } from 'express';
import { details, genres, popular, search, similar, topRated, trending, upcoming } from '../controllers/movieController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/trending', trending);
router.get('/popular', popular);
router.get('/top-rated', topRated);
router.get('/upcoming', upcoming);
router.get('/search', search);
router.get('/genres', genres);
router.get('/:tmdbId', details);
router.get('/:tmdbId/similar', similar);

export default router;
