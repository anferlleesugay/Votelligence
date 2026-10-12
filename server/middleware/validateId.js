// Checks that :id in the URL is a positive whole number before the handler runs.
// /api/polls/abc -> 400, /api/polls/9999 -> passes here, the handler returns 404.
function validateId(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'The id must be a positive whole number.' });
  }

  req.pollId = id;
  next();
}

export default validateId;
