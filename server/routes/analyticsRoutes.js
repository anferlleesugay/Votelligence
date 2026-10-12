import { Router } from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';

// Mounted at /api/analytics
const router = Router();

router.get('/', getAnalytics);

export default router;
