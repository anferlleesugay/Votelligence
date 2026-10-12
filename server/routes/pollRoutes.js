import { Router } from 'express';
import validateId from '../middleware/validateId.js';
import { requireLogin } from '../middleware/auth.js';
import {
  listPolls,
  getPoll,
  createPoll,
  deletePoll,
  closePoll,
  hasVoted,
  castVote,
  getResults,
} from '../controllers/pollController.js';

// Mounted at /api/polls in app.js, so "/" here means /api/polls
const router = Router();

router.get('/', listPolls);
router.post('/', requireLogin, createPoll);
router.get('/:id', validateId, getPoll);
router.delete('/:id', validateId, requireLogin, deletePoll);
router.patch('/:id/close', validateId, requireLogin, closePoll);
router.get('/:id/has-voted', validateId, hasVoted);
router.post('/:id/votes', validateId, castVote);
router.get('/:id/results', validateId, getResults);

export default router;
