import { Router } from 'express';
import { trending } from '../controllers/movieController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/trending', trending);

export default router;
