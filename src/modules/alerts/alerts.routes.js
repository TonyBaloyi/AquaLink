const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { authenticate, authorize, withSupplier, withHousehold } = require('../../middleware/auth');
const c = require('./alerts.controller');

const idParam = z.object({ id: z.string().uuid() });

router.use(authenticate, withSupplier, withHousehold);

router.get('/', c.list);
router.get('/:id', validate({ params: idParam }), c.get);
router.post('/', authorize('admin', 'supplier'), validate({ body: z.object({
  type: z.enum(['low_tank','no_flow','leak','overuse','payment_overdue','sensor_offline','system']),
  severity: z.enum(['info','warning','critical']).optional(),
  message: z.string().min(3),
  borehole_id: z.string().uuid().optional(),
  household_id: z.string().uuid().optional(),
  sensor_id: z.string().uuid().optional(),
}) }), c.create);
router.patch('/:id/acknowledge', authorize('admin','supplier'), validate({ params: idParam }), c.acknowledge);
router.patch('/:id/resolve', authorize('admin','supplier'), validate({ params: idParam }), c.resolve);

module.exports = router;
