import bcrypt from 'bcryptjs';
import * as User from '../models/userModel.js';
import { createToken } from '../middleware/auth.js';
import { firstError, hasErrors, validateRegister } from '../validators/validators.js';

// POST /api/auth/register
export async function register(req, res) {
  const { errors, value } = validateRegister(req.body);
  if (hasErrors(errors)) {
    return res.status(400).json({ error: firstError(errors), errors });
  }

  if (await User.existsByEmail(value.email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  if (await User.existsByUsername(value.username)) {
    return res.status(409).json({ error: 'This username is already taken.' });
  }

  // Store only a bcrypt hash, never the real password
  const passwordHash = await bcrypt.hash(value.password, 10);
  const userId = await User.create({ email: value.email, username: value.username, passwordHash });

  res.status(201).json({ token: createToken(userId, value.username), username: value.username, userId });
}

// POST /api/auth/login
export async function login(req, res) {
  const usernameOrEmail = typeof req.body?.usernameOrEmail === 'string' ? req.body.usernameOrEmail.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Enter your username/email and password.' });
  }

  const user = await User.findByUsernameOrEmail(usernameOrEmail);
  // Same message for "no such user" and "wrong password" so attackers can't tell which
  const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid username/email or password.' });
  }

  res.status(200).json({ token: createToken(user.id, user.username), username: user.username, userId: user.id });
}
