import { Router } from 'express';
import { genres, popular, search, topRated, trending, upcoming } from '../controllers/movieController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/trending', trending);
router.get('/popular', popular);
router.get('/top-rated', topRated);
router.get('/upcoming', upcoming);
router.get('/search', search);
router.get('/genres', genres);

export default router;
