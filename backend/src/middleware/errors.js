export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  if (err.name === 'ValidationError') status = 400;
  else if (err.name === 'CastError') status = 400;
  else if (err.name === 'MongoServerError' && err.code === 11000) status = 409;
  // Mongoose optimistic-concurrency conflict — two writes to the same document
  // raced. sessionFlow serializes per-session writes and retries on this, so a
  // VersionError here is a safety net, not the normal path. It is retryable.
  else if (err.name === 'VersionError') status = 409;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({
    error:
      status === 409 && err.message.includes('No matching document')
        ? 'The session was updated by another request — please retry.'
        : err.message,
  });
}
