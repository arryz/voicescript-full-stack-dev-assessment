import { Router } from 'express';
import { handleListReporters } from '../controllers/reporters';

const router = Router();

router.get('/', handleListReporters);

export default router;
