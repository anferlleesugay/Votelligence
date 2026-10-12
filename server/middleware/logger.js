// Custom logger middleware.
// Prints one line per request once the response has been sent, e.g.
// [14:05:12] POST /api/polls -> 201 (18 ms)
function logger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const time = new Date().toLocaleTimeString('en-GB');
    const duration = Date.now() - start;
    console.log(`[${time}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration} ms)`);
  });

  next();
}

export default logger;
