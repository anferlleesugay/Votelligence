// Runs schema.sql against a MySQL database (e.g. the Aiven one) without MySQL Workbench.
//
// Usage (PowerShell), from the server folder:
//   $env:DB_HOST="your-host"; $env:DB_PORT="12345"; $env:DB_USER="avnadmin"
//   $env:DB_PASSWORD="your-password"; $env:DB_SSL="true"
//   node scripts/run-schema.js
//
// It reads the connection details from the terminal's environment variables only,
// so the online database password is never saved in a file.
import fs from 'node:fs';
import mysql from 'mysql2/promise';

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing: ${missing.join(', ')}. Set them in the terminal first (see the top of this file).`);
  process.exit(1);
}

let connection;
try {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true, // schema.sql has many statements separated by ;
  });
} catch (err) {
  console.error('Could not connect:', err.message);
  process.exit(1);
}

try {
  const sql = fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  await connection.query(sql);
  console.log('schema.sql ran successfully. Polls in the database:');

  const [rows] = await connection.query('SELECT id, question, closed FROM votelligence_db.polls ORDER BY id');
  console.table(rows);
} catch (err) {
  console.error('Failed:', err.message);
  process.exitCode = 1;
} finally {
  await connection.end();
}