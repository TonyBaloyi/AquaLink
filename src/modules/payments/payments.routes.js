const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { authenticate, authorize, withSupplier, withHousehold } = require('../../middleware/auth');
const c = require('./payments.controller');

const idParam = z.object({ id: z.string().uuid() });

// Gateway callback - authenticated by signature, not by JWT.
router.post('/webhook', c.webhook);

router.use(authenticate, withSupplier, withHousehold);

// Payment Management module
router.get('/', c.list);
router.get('/:id', validate({ params: idParam }), c.get);
router.post('/invoices', authorize('admin'), validate({ body: z.object({
  household_id: z.string().uuid(),
  subscription_id: z.string().uuid().optional(),
  amount: z.coerce.number().positive(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
}) }), c.createInvoice);

router.post('/:id/pay', validate({
  params: idParam,
  body: z.object({ method: z.enum(['mobile_money', 'card', 'eft', 'cash']).optional() }),
}), c.initiate);

router.patch('/:id/mark-paid', authorize('admin'),
  validate({ params: idParam, body: z.object({ reference: z.string().optional() }) }), c.markPaid);

module.exports = router;
