import * as Poll from '../models/pollModel.js';
import * as Vote from '../models/voteModel.js';
import { sentimentBreakdown } from '../services/statsService.js';

// GET /api/analytics
export async function getAnalytics(req, res) {
  const polls = await Poll.findAll();
  const votes = await Vote.findAll();

  const { positive, neutral, negative } = sentimentBreakdown(votes);

  const pollsSummary = polls
    .map((poll) => ({
      id: poll.id,
      question: poll.question,
      totalVotes: votes.filter((vote) => vote.pollId === poll.id).length,
      closed: poll.closed,
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes);

  res.status(200).json({
    totalPolls: polls.length,
    totalVotes: votes.length,
    closedPolls: polls.filter((poll) => poll.closed).length,
    sentimentBreakdown: { positive, neutral, negative },
    pollsSummary,
  });
}
