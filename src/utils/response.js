const ok = (res, data, meta) => res.json({ success: true, data, ...(meta ? { meta } : {}) });
const created = (res, data) => res.status(201).json({ success: true, data });
const noContent = (res) => res.status(204).send();

/** Standard pagination params from ?page=&limit= */
function paginate(req, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || String(defaultLimit), 10), 1), maxLimit);
  return { page, limit, offset: (page - 1) * limit };
}

module.exports = { ok, created, noContent, paginate };
