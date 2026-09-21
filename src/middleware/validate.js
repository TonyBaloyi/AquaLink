const ApiError = require('../utils/ApiError');

/**
 * Validates req.body / req.query / req.params against zod schemas.
 * usage: validate({ body: createUserSchema })
 */
module.exports = (schemas) => (req, _res, next) => {
  try {
    for (const key of ['body', 'query', 'params']) {
      if (!schemas[key]) continue;
      const result = schemas[key].safeParse(req[key]);
      if (!result.success) {
        const details = result.error.issues.map(i => ({
          field: i.path.join('.'), message: i.message,
        }));
        throw ApiError.badRequest('Validation failed', details);
      }
      if (key === 'body') req.body = result.data;
      else req.validated = { ...(req.validated || {}), [key]: result.data };
    }
    next();
  } catch (err) { next(err); }
};
