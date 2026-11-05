import { Router } from 'express';
import { popular, topRated, trending, upcoming } from '../controllers/movieController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/trending', trending);
router.get('/popular', popular);
router.get('/top-rated', topRated);
router.get('/upcoming', upcoming);

export default router;
