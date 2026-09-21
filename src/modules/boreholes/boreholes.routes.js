const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { authenticate, authorize, withSupplier } = require('../../middleware/auth');
const c = require('./boreholes.controller');

const idParam = z.object({ id: z.string().uuid() });
const createSchema = z.object({
  supplier_id: z.string().uuid().optional(),      // ignored for supplier accounts
  name: z.string().min(2),
  location: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  tank_capacity_litres: z.coerce.number().int().positive().optional(),
  yield_litres_per_hour: z.coerce.number().int().positive().optional(),
  installed_at: z.string().optional(),
});
const updateSchema = createSchema.partial().extend({
  status: z.enum(['active', 'suspended', 'pending']).optional(),
});
const sensorSchema = z.object({
  type: z.enum(['flow', 'level']),
  serial_number: z.string().min(3),
  household_id: z.string().uuid().optional(),
});

router.use(authenticate, authorize('admin', 'supplier'), withSupplier);

router.get('/', c.list);
router.post('/', validate({ body: createSchema }), c.create);
router.get('/:id', validate({ params: idParam }), c.get);
router.get('/:id/tank', validate({ params: idParam }), c.tank);
router.post('/:id/sensors', validate({ params: idParam, body: sensorSchema }), c.addSensor);
router.patch('/:id', validate({ params: idParam, body: updateSchema }), c.update);
router.delete('/:id', authorize('admin'), validate({ params: idParam }), c.remove);

module.exports = router;
