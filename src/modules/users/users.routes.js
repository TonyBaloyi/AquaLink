const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const c = require('./users.controller');

const idParam = z.object({ id: z.string().uuid() });
const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(['admin', 'supplier', 'household']),
  status: z.enum(['active', 'suspended', 'pending']).optional(),
});
const updateSchema = createSchema.partial().omit({ password: true });

// User Management module - administrator only (Presentation layer 1.3)
router.use(authenticate, authorize('admin'));

router.get('/', c.list);
router.post('/', validate({ body: createSchema }), c.create);
router.get('/:id', validate({ params: idParam }), c.get);
router.patch('/:id', validate({ params: idParam, body: updateSchema }), c.update);
router.patch('/:id/status',
  validate({ params: idParam, body: z.object({ status: z.enum(['active', 'suspended', 'pending']) }) }),
  c.setStatus);
router.delete('/:id', validate({ params: idParam }), c.remove);

module.exports = router;
