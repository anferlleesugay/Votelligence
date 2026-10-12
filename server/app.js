import './env.js'; // must stay first: loads .env before db.js reads it
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import logger from './middleware/logger.js';
import { readUser } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import pollRoutes from './routes/pollRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',');

// 1. Middleware runs in the order it is registered, so these go before the routes
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(logger);
app.use(readUser); // reads the JWT (if any) and sets req.user

// 2. Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// 3. Fallbacks: unknown route, then the error handler (always last)
app.use(notFound);
app.use(errorHandler);

// Check the database before accepting requests, so a wrong .env fails loudly
try {
  await pool.query('SELECT 1');
  console.log(`Connected to MySQL database "${process.env.DB_NAME}"`);
} catch (err) {
  console.error('Could not connect to MySQL. Check your .env values.');
  console.error(err.message);
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing from .env');
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set: AI features will return an error until you add it.');
}

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
