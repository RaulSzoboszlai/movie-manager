import { Router } from 'express';
import { stats } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/stats', stats);

export default router;
