import { Router } from 'express';
import {
    addListMovie,
    createList,
    deleteList,
    getList,
    listLists,
    removeListMovie,
    updateList,
} from '../controllers/listController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listLists);
router.post('/', createList);
router.get('/:id', getList);
router.patch('/:id', updateList);
router.delete('/:id', deleteList);
router.post('/:id/movies', addListMovie);
router.delete('/:id/movies/:tmdbId', removeListMovie);

export default router;
