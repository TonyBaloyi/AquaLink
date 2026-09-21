const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, paginate } = require('../../utils/response');
const ApiError = require('../../utils/ApiError');
const service = require('./subscriptions.service');

exports.listPlans = asyncHandler(async (req, res) =>
  ok(res, await service.listPlans(req.query.all !== 'true')));
exports.createPlan = asyncHandler(async (req, res) => created(res, await service.createPlan(req.body)));
exports.updatePlan = asyncHandler(async (req, res) => ok(res, await service.updatePlan(req.params.id, req.body)));

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const filters = { ...req.query, limit, offset };
  if (req.user.role === 'supplier') filters.supplier_id = req.supplier.id;
  if (req.user.role === 'household') filters.household_id = req.household.id;
  const { rows } = await service.list(filters);
  ok(res, rows, { page, limit });
});

exports.get = asyncHandler(async (req, res) => ok(res, await service.get(req.params.id)));

exports.subscribe = asyncHandler(async (req, res) => {
  const householdId = req.user.role === 'household' ? req.household.id : req.body.household_id;
  if (!householdId) throw ApiError.badRequest('household_id is required');
  created(res, await service.subscribe({ household_id: householdId, plan_id: req.body.plan_id }));
});

exports.changeStatus = asyncHandler(async (req, res) =>
  ok(res, await service.changeStatus(req.params.id, req.body.status)));
exports.changePlan = asyncHandler(async (req, res) =>
  ok(res, await service.changePlan(req.params.id, req.body.plan_id)));
