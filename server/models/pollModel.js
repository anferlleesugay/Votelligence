import pool from '../db.js';

// Every query uses ? placeholders, so user values are never glued into the SQL text.
// "AS" renames snake_case columns to the camelCase names React uses.

const POLL_COLUMNS = `
  id,
  question,
  description,
  category,
  closed,
  owner_id   AS ownerId,
  created_at AS createdAt`;

// MySQL sends booleans back as 1 or 0, so turn closed into true/false
function toPoll(row, options) {
  return { ...row, closed: Boolean(row.closed), options };
}

// All polls, each with its options: [{ id, question, ..., options: [{ id, text }] }]
export async function findAll() {
  const [polls] = await pool.execute(`SELECT ${POLL_COLUMNS} FROM polls ORDER BY created_at DESC, id DESC`);
  const [options] = await pool.execute('SELECT id, poll_id AS pollId, text FROM poll_options ORDER BY position');

  return polls.map((poll) =>
    toPoll(
      poll,
      options.filter((option) => option.pollId === poll.id).map(({ id, text }) => ({ id, text }))
    )
  );
}

// One poll with its options, or null if it does not exist
export async function findById(id) {
  const [rows] = await pool.execute(`SELECT ${POLL_COLUMNS} FROM polls WHERE id = ?`, [id]);
  if (rows.length === 0) return null;

  const [options] = await pool.execute(
    'SELECT id, text FROM poll_options WHERE poll_id = ? ORDER BY position',
    [id]
  );
  return toPoll(rows[0], options);
}

// Saves a poll and its options. The transaction makes it all-or-nothing:
// if one option fails to insert, the poll row is rolled back too.
export async function create(poll, ownerId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      'INSERT INTO polls (question, description, category, owner_id) VALUES (?, ?, ?, ?)',
      [poll.question, poll.description, poll.category, ownerId]
    );
    const pollId = result.insertId;

    for (const [index, text] of poll.options.entries()) {
      await connection.execute('INSERT INTO poll_options (poll_id, text, position) VALUES (?, ?, ?)', [
        pollId,
        text,
        index + 1,
      ]);
    }

    await connection.commit();
    return pollId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release(); // always give the connection back to the pool
  }
}

// UPDATE query used by "Close Poll"
export async function close(id) {
  await pool.execute('UPDATE polls SET closed = TRUE WHERE id = ?', [id]);
}

// Options and votes are removed automatically by ON DELETE CASCADE (schema.sql)
export async function remove(id) {
  const [result] = await pool.execute('DELETE FROM polls WHERE id = ?', [id]);
  return result.affectedRows > 0;
}
