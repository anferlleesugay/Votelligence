// Runs when no route matched the request.
export function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
}

// Express knows this is an error handler because it has 4 parameters.
// In Express 5, an error thrown inside an async handler is sent here automatically.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // express.json() could not parse the body, e.g. a missing quote in Thunder Client
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }

  // Errors from the Gemini API carry their own status (see services/aiService.js)
  if (err.isAiError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}
