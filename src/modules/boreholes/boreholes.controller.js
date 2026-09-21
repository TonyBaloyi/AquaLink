const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent, paginate } = require('../../utils/response');
const service = require('./boreholes.service');

const isSupplier = (req) => req.user.role === 'supplier';

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const filters = { ...req.query, limit, offset };
  if (isSupplier(req)) filters.supplier_id = req.supplier.id;   // scope to own boreholes
  const { rows, count } = await service.list(filters);
  ok(res, rows, { page, limit, total: count, pages: Math.ceil(count / limit) });
});

exports.get = asyncHandler(async (req, res) => {
  if (isSupplier(req)) await service.assertOwnership(req.params.id, req.supplier.id);
  ok(res, await service.get(req.params.id));
});

exports.create = asyncHandler(async (req, res) =>
  created(res, await service.create(req.body, isSupplier(req) ? req.supplier.id : null)));

exports.update = asyncHandler(async (req, res) => {
  if (isSupplier(req)) await service.assertOwnership(req.params.id, req.supplier.id);
  ok(res, await service.update(req.params.id, req.body));
});

exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  noContent(res);
});

exports.tank = asyncHandler(async (req, res) => {
  if (isSupplier(req)) await service.assertOwnership(req.params.id, req.supplier.id);
  ok(res, await service.tankLevel(req.params.id));
});

exports.addSensor = asyncHandler(async (req, res) => {
  if (isSupplier(req)) await service.assertOwnership(req.params.id, req.supplier.id);
  created(res, await service.addSensor(req.params.id, req.body));
});
