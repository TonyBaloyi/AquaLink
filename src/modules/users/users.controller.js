const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent, paginate } = require('../../utils/response');
const service = require('./users.service');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { rows, count } = await service.list({ ...req.query, limit, offset });
  ok(res, rows, { page, limit, total: count, pages: Math.ceil(count / limit) });
});
exports.get = asyncHandler(async (req, res) => ok(res, await service.get(req.params.id)));
exports.create = asyncHandler(async (req, res) => created(res, await service.create(req.body)));
exports.update = asyncHandler(async (req, res) => ok(res, await service.update(req.params.id, req.body)));
exports.setStatus = asyncHandler(async (req, res) => ok(res, await service.setStatus(req.params.id, req.body.status)));
exports.remove = asyncHandler(async (req, res) => { await service.remove(req.params.id); noContent(res); });
