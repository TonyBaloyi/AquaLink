const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');
const service = require('./auth.service');

exports.register = asyncHandler(async (req, res) => created(res, await service.registerHousehold(req.body)));
exports.login = asyncHandler(async (req, res) => ok(res, await service.login(req.body)));
exports.me = asyncHandler(async (req, res) => ok(res, await service.me(req.user)));
exports.refresh = asyncHandler(async (req, res) => ok(res, await service.refresh(req.body.refreshToken)));
exports.forgotPassword = asyncHandler(async (req, res) => ok(res, await service.forgotPassword(req.body.email)));
exports.resetPassword = asyncHandler(async (req, res) => ok(res, await service.resetPassword(req.body)));
exports.changePassword = asyncHandler(async (req, res) => ok(res, await service.changePassword(req.user.id, req.body)));
exports.logout = asyncHandler(async (req, res) => ok(res, await service.logout(req.headers.authorization?.replace(/^Bearer /, ''))));
