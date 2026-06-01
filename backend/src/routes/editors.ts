import { Router } from 'express';
import { handleListEditors } from '../controllers/editors';

const router = Router();

router.get('/', handleListEditors);

export default router;
