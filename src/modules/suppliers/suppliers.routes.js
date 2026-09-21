const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { authenticate, authorize, withSupplier } = require('../../middleware/auth');
const c = require('./suppliers.controller');

const idParam = z.object({ id: z.string().uuid() });
const createSchema = z.object({
  name: z.string().min(2),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  village: z.string().optional(),
  region: z.string().optional(),
  user_id: z.string().uuid().optional(),
  account: z.object({ email: z.string().email(), password: z.string().min(8) }).optional(),
});
const updateSchema = createSchema.partial().extend({
  status: z.enum(['active', 'suspended', 'pending']).optional(),
});

router.use(authenticate, withSupplier);

// Supplier's own views
router.get('/me', authorize('supplier'), c.me);
router.get('/me/dashboard', authorize('supplier'), c.dashboard);

// Supplier Management module - administrator only
router.get('/', authorize('admin'), c.list);
router.post('/', authorize('admin'), validate({ body: createSchema }), c.create);
router.get('/:id', authorize('admin'), validate({ params: idParam }), c.get);
router.get('/:id/dashboard', authorize('admin'), validate({ params: idParam }), c.dashboard);
router.patch('/:id', authorize('admin'), validate({ params: idParam, body: updateSchema }), c.update);
router.delete('/:id', authorize('admin'), validate({ params: idParam }), c.remove);

module.exports = router;
