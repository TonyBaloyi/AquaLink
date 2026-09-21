const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, paginate } = require('../../utils/response');
const service = require('./readings.service');

exports.ingest = asyncHandler(async (req, res) => created(res, await service.ingest(req.body)));
exports.ingestBatch = asyncHandler(async (req, res) => ok(res, await service.ingestBatch(req.body.readings)));

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req, 50, 500);
  const filters = { ...req.query, limit, offset };
  if (req.user.role === 'household') filters.household_id = req.household.id;
  ok(res, await service.list(filters), { page, limit });
});

exports.usage = asyncHandler(async (req, res) => {
  const filters = { ...req.query, days: Number(req.query.days || 30) };
  if (req.user.role === 'household') filters.household_id = req.household.id;
  if (req.user.role === 'supplier') filters.supplier_id = req.supplier.id;
  ok(res, await service.usage(filters));
});
