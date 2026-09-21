const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent, paginate } = require('../../utils/response');
const service = require('./households.service');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const filters = { ...req.query, limit, offset };
  if (req.user.role === 'supplier') filters.supplier_id = req.supplier.id;
  const { rows, count } = await service.list(filters);
  ok(res, rows, { page, limit, total: count, pages: Math.ceil(count / limit) });
});

exports.me = asyncHandler(async (req, res) => ok(res, await service.summary(req.household.id)));

exports.get = asyncHandler(async (req, res) => {
  service.assertSelf(req, req.params.id);
  ok(res, await service.get(req.params.id));
});

exports.summary = asyncHandler(async (req, res) => {
  service.assertSelf(req, req.params.id);
  ok(res, await service.summary(req.params.id));
});

exports.create = asyncHandler(async (req, res) => created(res, await service.create(req.body)));

exports.update = asyncHandler(async (req, res) => {
  service.assertSelf(req, req.params.id);
  ok(res, await service.update(req.params.id, req.body));
});

exports.remove = asyncHandler(async (req, res) => { await service.remove(req.params.id); noContent(res); });
