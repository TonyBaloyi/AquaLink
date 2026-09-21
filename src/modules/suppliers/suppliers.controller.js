const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent, paginate } = require('../../utils/response');
const ApiError = require('../../utils/ApiError');
const service = require('./suppliers.service');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const { rows, count } = await service.list({ ...req.query, limit, offset });
  ok(res, rows, { page, limit, total: count, pages: Math.ceil(count / limit) });
});
exports.get = asyncHandler(async (req, res) => ok(res, await service.get(req.params.id)));
exports.create = asyncHandler(async (req, res) => created(res, await service.create(req.body)));
exports.update = asyncHandler(async (req, res) => ok(res, await service.update(req.params.id, req.body)));
exports.remove = asyncHandler(async (req, res) => { await service.remove(req.params.id); noContent(res); });

/** GET /suppliers/me - the logged in supplier's own record. */
exports.me = asyncHandler(async (req, res) => {
  if (!req.supplier) throw ApiError.forbidden('Only suppliers can use this endpoint');
  ok(res, await service.get(req.supplier.id));
});

exports.dashboard = asyncHandler(async (req, res) => {
  const supplierId = req.user.role === 'supplier' ? req.supplier.id : req.params.id;
  ok(res, await service.dashboard(supplierId));
});
