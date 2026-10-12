import * as Poll from '../models/pollModel.js';
import * as Vote from '../models/voteModel.js';
import * as Ai from '../services/aiService.js';

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// POST /api/ai/generate-poll   { topic }
export async function generatePoll(req, res) {
  const topic = readText(req.body?.topic);
  if (topic.length < 2 || topic.length > 200) {
    return res.status(400).json({ error: 'Describe a topic in 2 to 200 characters.' });
  }

  const draft = await Ai.generatePoll(topic);
  res.status(200).json(draft);
}

// POST /api/ai/analyze-sentiment   { text }
export async function analyzeSentiment(req, res) {
  const text = readText(req.body?.text);
  if (!text) {
    return res.status(400).json({ error: 'Text is required.' });
  }

  const sentiment = await Ai.analyzeSentiment(text);
  res.status(200).json({ sentiment });
}

// POST /api/ai/polls/:id/summary
export async function summarizePoll(req, res) {
  const poll = await Poll.findById(req.pollId);
  if (!poll) {
    return res.status(404).json({ error: `Poll not found: ${req.pollId}` });
  }

  const votes = await Vote.findByPollId(req.pollId);
  const lines = poll.options.map((option) => {
    const count = votes.filter((vote) => vote.optionId === option.id).length;
    return `${option.text}: ${count} votes`;
  });

  const summary = await Ai.summarizeResults(poll.question, lines);
  res.status(200).json({ summary });
}

// POST /api/ai/polls/:id/check-duplicate   { text }
// Compares the meaning of the text with every option using embeddings.
export async function checkDuplicate(req, res) {
  const poll = await Poll.findById(req.pollId);
  if (!poll) {
    return res.status(404).json({ error: `Poll not found: ${req.pollId}` });
  }

  const text = readText(req.body?.text);
  if (!text) {
    return res.status(400).json({ error: 'Text is required.' });
  }

  const candidate = await Ai.embedText(text);
  let bestMatch = null;
  let bestScore = 0;

  for (const option of poll.options) {
    const existing = await Ai.embedText(option.text);
    const score = Ai.cosineSimilarity(candidate, existing);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = option.text;
    }
  }

  res.status(200).json({
    mostSimilarOption: bestMatch ?? 'No options to compare',
    similarityScore: Math.round(bestScore * 1000) / 1000,
    likelyDuplicate: bestScore >= 0.9,
  });
}
