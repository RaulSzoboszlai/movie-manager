import { Router } from 'express';
import { addToLibrary, listLibrary, removeFromLibrary, updateLibraryMovie } from '../controllers/libraryController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listLibrary);
router.post('/', addToLibrary);
router.patch('/:tmdbId', updateLibraryMovie);
router.delete('/:tmdbId', removeFromLibrary);

export default router;
