const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, paginate } = require('../../utils/response');
const ApiError = require('../../utils/ApiError');
const service = require('./payments.service');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req);
  const filters = { ...req.query, limit, offset };
  if (req.user.role === 'supplier') filters.supplier_id = req.supplier.id;
  if (req.user.role === 'household') filters.household_id = req.household.id;
  const { rows, count } = await service.list(filters);
  ok(res, rows, { page, limit, total: count, pages: Math.ceil(count / limit) });
});

exports.get = asyncHandler(async (req, res) => ok(res, await service.get(req.params.id)));

exports.createInvoice = asyncHandler(async (req, res) => created(res, await service.createInvoice(req.body)));

exports.initiate = asyncHandler(async (req, res) => {
  const payment = await service.get(req.params.id);
  if (req.user.role === 'household' && payment.household_id !== req.household.id) {
    throw ApiError.forbidden('You may only pay your own invoices');
  }
  ok(res, await service.initiate(req.params.id, req.body.method));
});

exports.markPaid = asyncHandler(async (req, res) => ok(res, await service.markPaid(req.params.id, req.body)));

exports.webhook = asyncHandler(async (req, res) => ok(res, await service.handleWebhook(req.body, req.headers)));
