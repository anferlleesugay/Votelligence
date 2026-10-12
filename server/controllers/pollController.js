import * as Poll from '../models/pollModel.js';
import * as Vote from '../models/voteModel.js';
import { analyzeSentiment } from '../services/aiService.js';
import { anonymousLabel, detectAnomaly, marginOfError, roundTo1, sentimentBreakdown } from '../services/statsService.js';
import { firstError, hasErrors, validatePoll, validateVote } from '../validators/validators.js';

// Each handler is a named function that sends exactly one response.
// Every early response uses "return" so the code below it never runs.
// Unexpected errors (e.g. MySQL is down) are thrown and caught by errorHandler.

function pollNotFound(res, id) {
  return res.status(404).json({ error: `Poll not found: ${id}` });
}

// GET /api/polls
export async function listPolls(req, res) {
  const polls = await Poll.findAll();
  res.status(200).json(polls);
}

// GET /api/polls/:id
export async function getPoll(req, res) {
  const poll = await Poll.findById(req.pollId);
  if (!poll) return pollNotFound(res, req.pollId);

  res.status(200).json(poll);
}

// POST /api/polls  (must be logged in)
export async function createPoll(req, res) {
  const { errors, value } = validatePoll(req.body);
  if (hasErrors(errors)) {
    return res.status(400).json({ error: firstError(errors), errors });
  }

  const newId = await Poll.create(value, req.user.userId);
  const poll = await Poll.findById(newId);
  res.status(201).json(poll);
}

// DELETE /api/polls/:id  (owner only)
export async function deletePoll(req, res) {
  const poll = await Poll.findById(req.pollId);
  if (!poll) return pollNotFound(res, req.pollId);

  if (poll.ownerId !== req.user.userId) {
    return res.status(403).json({ error: 'You can only delete polls you created.' });
  }

  await Poll.remove(req.pollId);
  res.status(200).json({ message: 'Poll deleted.', id: req.pollId });
}

// PATCH /api/polls/:id/close  (owner only)
export async function closePoll(req, res) {
  const poll = await Poll.findById(req.pollId);
  if (!poll) return pollNotFound(res, req.pollId);

  if (poll.ownerId !== req.user.userId) {
    return res.status(403).json({ error: 'You can only close polls you created.' });
  }
  if (poll.closed) {
    return res.status(409).json({ error: 'This poll is already closed.' });
  }

  await Poll.close(req.pollId);
  const updated = await Poll.findById(req.pollId);
  res.status(200).json(updated);
}

// GET /api/polls/:id/has-voted?voterFingerprint=...
export async function hasVoted(req, res) {
  const voterFingerprint = req.query.voterFingerprint;
  if (typeof voterFingerprint !== 'string' || voterFingerprint.trim() === '') {
    return res.status(400).json({ error: 'voterFingerprint is required.' });
  }

  const voted = await Vote.hasVoted(req.pollId, voterFingerprint.trim());
  res.status(200).json({ hasVoted: voted });
}

// POST /api/polls/:id/votes
export async function castVote(req, res) {
  const poll = await Poll.findById(req.pollId);
  if (!poll) return pollNotFound(res, req.pollId);

  const { errors, value } = validateVote(req.body);
  if (hasErrors(errors)) {
    return res.status(400).json({ error: firstError(errors), errors });
  }

  if (poll.closed) {
    return res.status(409).json({ error: 'This poll is closed and no longer accepting votes.' });
  }

  if (!poll.options.some((option) => option.id === value.optionId)) {
    return res.status(400).json({ error: `Option ${value.optionId} is not part of this poll.` });
  }

  // AI sentiment for the optional comment. If the AI fails, fall back to NEUTRAL
  // so a vote is never lost because of the AI service.
  let sentiment = null;
  if (value.comment) {
    try {
      sentiment = await analyzeSentiment(value.comment);
    } catch {
      sentiment = 'NEUTRAL';
    }
  }

  try {
    const vote = await Vote.create(req.pollId, { ...value, sentiment });
    res.status(201).json(vote);
  } catch (err) {
    // The UNIQUE (poll_id, voter_fingerprint) key rejected a second vote
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "You've already voted on this poll." });
    }
    throw err;
  }
}

// GET /api/polls/:id/results
export async function getResults(req, res) {
  const poll = await Poll.findById(req.pollId);
  if (!poll) return pollNotFound(res, req.pollId);

  const votes = await Vote.findByPollId(req.pollId);
  const total = votes.length;

  const results = poll.options.map((option) => {
    const count = votes.filter((vote) => vote.optionId === option.id).length;
    const percentage = total === 0 ? 0 : (100 * count) / total;
    return {
      optionId: option.id,
      text: option.text,
      votes: count,
      percentage: roundTo1(percentage),
      marginOfError: roundTo1(marginOfError(count, total)),
    };
  });

  const comments = votes
    .filter((vote) => vote.comment)
    .map((vote) => ({
      text: vote.comment,
      sentiment: vote.sentiment,
      voterLabel: anonymousLabel(vote.voterFingerprint),
    }));

  const anomaly = detectAnomaly(votes);

  res.status(200).json({
    pollId: poll.id,
    question: poll.question,
    totalVotes: total,
    closed: poll.closed,
    ownerId: poll.ownerId,
    results,
    anomalyDetected: anomaly.anomalyDetected,
    anomalyNote: anomaly.anomalyNote,
    sentimentBreakdown: sentimentBreakdown(votes),
    comments,
  });
}
