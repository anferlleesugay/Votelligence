import pool from '../db.js';

// Finds a user by username OR email (the login form accepts either)
export async function findByUsernameOrEmail(usernameOrEmail) {
  const [rows] = await pool.execute(
    'SELECT id, email, username, password_hash AS passwordHash FROM users WHERE username = ? OR email = ?',
    [usernameOrEmail, usernameOrEmail.toLowerCase()]
  );
  return rows[0] ?? null;
}

export async function existsByEmail(email) {
  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
  return rows.length > 0;
}

export async function existsByUsername(username) {
  const [rows] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
  return rows.length > 0;
}

export async function create({ email, username, passwordHash }) {
  const [result] = await pool.execute('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)', [
    email,
    username,
    passwordHash,
  ]);
  return result.insertId;
}
