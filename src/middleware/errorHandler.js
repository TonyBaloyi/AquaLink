const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const notFound = (req, _res, next) =>
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Postgres constraint violations -> friendly messages
  if (err.code === '23505') { status = 409; message = 'That record already exists'; }
  if (err.code === '23503') { status = 400; message = 'Related record does not exist'; }
  if (err.code === '22P02') { status = 400; message = 'Malformed identifier'; }

  if (status >= 500) console.error('[error]', err);

  res.status(status).json({
    success: false,
    error: { message, ...(err.details ? { details: err.details } : {}) },
    ...(env.nodeEnv === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };
