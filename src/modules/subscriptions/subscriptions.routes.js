const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { authenticate, authorize, withSupplier, withHousehold } = require('../../middleware/auth');
const c = require('./subscriptions.controller');

const idParam = z.object({ id: z.string().uuid() });
const planSchema = z.object({
  name: z.string().min(2),
  monthly_fee: z.coerce.number().nonnegative(),
  litres_included: z.coerce.number().int().nonnegative().optional(),
  rate_per_extra_litre: z.coerce.number().nonnegative().optional(),
  description: z.string().optional(),
});

router.use(authenticate, withSupplier, withHousehold);

// Water plans - visible to everyone signed in, managed by admin
router.get('/plans', c.listPlans);
router.post('/plans', authorize('admin'), validate({ body: planSchema }), c.createPlan);
router.patch('/plans/:id', authorize('admin'),
  validate({ params: idParam, body: planSchema.partial().extend({ is_active: z.boolean().optional() }) }),
  c.updatePlan);

// Subscription Management module
router.get('/', c.list);
router.post('/', validate({ body: z.object({
  plan_id: z.string().uuid(),
  household_id: z.string().uuid().optional(),
}) }), c.subscribe);
router.get('/:id', validate({ params: idParam }), c.get);
router.patch('/:id/status', authorize('admin'),
  validate({ params: idParam, body: z.object({ status: z.enum(['active','suspended','cancelled','pending']) }) }),
  c.changeStatus);
router.patch('/:id/plan',
  validate({ params: idParam, body: z.object({ plan_id: z.string().uuid() }) }), c.changePlan);

module.exports = router;
