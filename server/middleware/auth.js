import jwt from 'jsonwebtoken';

// Runs on every request. If there is a valid "Authorization: Bearer <token>" header,
// it puts { userId, username } on req.user. Otherwise req.user stays null (a guest).
// Guests can still list, view, and vote, so this never blocks a request.
export function readUser(req, res, next) {
  req.user = null;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { userId: payload.userId, username: payload.sub };
    } catch {
      // Invalid or expired token: treat the request as a guest
    }
  }

  next();
}

// Put this in front of routes that need a logged-in user
export function requireLogin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to do that.' });
  }
  next();
}

export function createToken(userId, username) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { subject: username, expiresIn: '7d' });
}
