const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth');
const c = require('./reports.controller');

// Reporting & Analytics module - administrator only
router.use(authenticate, authorize('admin'));

router.get('/overview', c.overview);
router.get('/usage', c.usage);
router.get('/revenue', c.revenue);
router.get('/alerts', c.alerts);
router.get('/top-consumers', c.topConsumers);

module.exports = router;
