const router = require('express').Router();

router.use('/auth', require('./modules/auth/auth.routes'));
router.use('/users', require('./modules/users/users.routes'));
router.use('/suppliers', require('./modules/suppliers/suppliers.routes'));
router.use('/boreholes', require('./modules/boreholes/boreholes.routes'));
router.use('/households', require('./modules/households/households.routes'));
router.use('/subscriptions', require('./modules/subscriptions/subscriptions.routes'));
router.use('/payments', require('./modules/payments/payments.routes'));
router.use('/readings', require('./modules/readings/readings.routes'));
router.use('/alerts', require('./modules/alerts/alerts.routes'));
router.use('/reports', require('./modules/reports/reports.routes'));

router.get('/', (_req, res) => res.json({
  name: 'AquaLink API',
  version: '1.0.0',
  modules: ['auth', 'users', 'suppliers', 'boreholes', 'households',
            'subscriptions', 'payments', 'readings', 'alerts', 'reports'],
}));

module.exports = router;
