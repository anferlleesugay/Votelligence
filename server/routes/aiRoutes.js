import { Router } from 'express';
import validateId from '../middleware/validateId.js';
import { generatePoll, analyzeSentiment, summarizePoll, checkDuplicate } from '../controllers/aiController.js';

// Mounted at /api/ai
const router = Router();

router.post('/generate-poll', generatePoll);
router.post('/analyze-sentiment', analyzeSentiment);
router.post('/polls/:id/summary', validateId, summarizePoll);
router.post('/polls/:id/check-duplicate', validateId, checkDuplicate);

export default router;
