import pool from '../db.js';

const VOTE_COLUMNS = `
  id,
  poll_id           AS pollId,
  option_id         AS optionId,
  comment,
  sentiment,
  voter_fingerprint AS voterFingerprint,
  voted_at          AS votedAt`;

export async function findByPollId(pollId) {
  const [rows] = await pool.execute(`SELECT ${VOTE_COLUMNS} FROM votes WHERE poll_id = ? ORDER BY voted_at, id`, [
    pollId,
  ]);
  return rows;
}

export async function findAll() {
  const [rows] = await pool.execute(`SELECT ${VOTE_COLUMNS} FROM votes`);
  return rows;
}

export async function hasVoted(pollId, voterFingerprint) {
  const [rows] = await pool.execute('SELECT id FROM votes WHERE poll_id = ? AND voter_fingerprint = ?', [
    pollId,
    voterFingerprint,
  ]);
  return rows.length > 0;
}

// Throws an error with code ER_DUP_ENTRY if this voter already voted on this poll
export async function create(pollId, vote) {
  const [result] = await pool.execute(
    'INSERT INTO votes (poll_id, option_id, comment, sentiment, voter_fingerprint) VALUES (?, ?, ?, ?, ?)',
    [pollId, vote.optionId, vote.comment, vote.sentiment, vote.voterFingerprint]
  );

  const [rows] = await pool.execute(`SELECT ${VOTE_COLUMNS} FROM votes WHERE id = ?`, [result.insertId]);
  return rows[0];
}
