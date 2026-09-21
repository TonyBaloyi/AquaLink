const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, paginate } = require('../../utils/response');
const service = require('./alerts.service');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const filters = { ...req.query, limit, offset };
  if (req.user.role === 'supplier') filters.supplier_id = req.supplier.id;
  if (req.user.role === 'household') filters.household_id = req.household.id;
  const { rows, count } = await service.list(filters);
  ok(res, rows, { page, limit, total: count, pages: Math.ceil(count / limit) });
});

exports.get = asyncHandler(async (req, res) => ok(res, await service.get(req.params.id)));
exports.create = asyncHandler(async (req, res) => created(res, await service.raise(req.body)));
exports.acknowledge = asyncHandler(async (req, res) => ok(res, await service.setStatus(req.params.id, 'acknowledged')));
exports.resolve = asyncHandler(async (req, res) => ok(res, await service.setStatus(req.params.id, 'resolved')));
