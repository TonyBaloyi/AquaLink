const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');
const service = require('./reports.service');

exports.overview = asyncHandler(async (_req, res) => ok(res, await service.overview()));
exports.usage = asyncHandler(async (req, res) => ok(res, await service.usageReport(req.query)));
exports.revenue = asyncHandler(async (req, res) => ok(res, await service.revenueReport({ months: Number(req.query.months || 12) })));
exports.alerts = asyncHandler(async (req, res) => ok(res, await service.alertReport({ days: Number(req.query.days || 30) })));
exports.topConsumers = asyncHandler(async (req, res) =>
  ok(res, await service.topConsumers({ limit: Number(req.query.limit || 10), days: Number(req.query.days || 30) })));
