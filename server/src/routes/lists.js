import { Router } from 'express';
import { createList, deleteList, getList, listLists, updateList } from '../controllers/listController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listLists);
router.post('/', createList);
router.get('/:id', getList);
router.patch('/:id', updateList);
router.delete('/:id', deleteList);

export default router;
