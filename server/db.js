import mysql from 'mysql2/promise';

// Online databases (like Aiven) only accept encrypted connections.
// DB_SSL=true turns encryption on. If DB_CA_CERT is also set, the server's
// certificate is checked against it too (the safest option).
function sslOptions() {
  if (process.env.DB_SSL !== 'true') return undefined; // local MySQL: no SSL
  if (process.env.DB_CA_CERT) return { ca: process.env.DB_CA_CERT };
  return { rejectUnauthorized: false };
}

// A pool keeps a few connections open and reuses them,
// instead of opening a new connection for every request.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: sslOptions(),
  waitForConnections: true,
  connectionLimit: 10,
  // Return DATE and TIMESTAMP columns as plain strings ("2026-10-26")
  // so dates are not shifted by time zones when sent to React.
  dateStrings: true,
});

export default pool;