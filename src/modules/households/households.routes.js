const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { authenticate, authorize, withSupplier, withHousehold } = require('../../middleware/auth');
const c = require('./households.controller');

const idParam = z.object({ id: z.string().uuid() });
const createSchema = z.object({
  address: z.string().min(3),
  village: z.string().optional(),
  household_size: z.coerce.number().int().positive().optional(),
  meter_number: z.string().optional(),
  borehole_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  account: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
  }).optional(),
});
const updateSchema = createSchema.partial().extend({
  status: z.enum(['active', 'suspended', 'pending']).optional(),
});

router.use(authenticate, withSupplier, withHousehold);

// Household portal - subscriber's own record
router.get('/me', authorize('household'), c.me);

// Household Management module
router.get('/', authorize('admin', 'supplier'), c.list);
router.post('/', authorize('admin'), validate({ body: createSchema }), c.create);
router.get('/:id', validate({ params: idParam }), c.get);
router.get('/:id/summary', validate({ params: idParam }), c.summary);
router.patch('/:id', validate({ params: idParam, body: updateSchema }), c.update);
router.delete('/:id', authorize('admin'), validate({ params: idParam }), c.remove);

module.exports = router;
