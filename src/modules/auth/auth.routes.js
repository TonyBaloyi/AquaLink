const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const c = require('./auth.controller');

const passwordRule = z.string().min(8, 'Password must be at least 8 characters');

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6).optional(),
  password: passwordRule,
  address: z.string().min(3),
  village: z.string().optional(),
  household_size: z.coerce.number().int().positive().optional(),
  borehole_id: z.string().uuid().optional(),
  meter_number: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  userType: z.enum(['admin', 'supplier', 'household']).optional(),
  remember: z.boolean().optional(),
});

router.post('/register', validate({ body: registerSchema }), c.register);
router.post('/login', validate({ body: loginSchema }), c.login);
router.post('/refresh', validate({ body: z.object({ refreshToken: z.string() }) }), c.refresh);
router.post('/forgot-password', validate({ body: z.object({ email: z.string().email() }) }), c.forgotPassword);
router.post('/reset-password', validate({ body: z.object({ accessToken: z.string(), newPassword: passwordRule }) }), c.resetPassword);

router.use(authenticate);
router.get('/me', c.me);
router.post('/logout', c.logout);
router.post('/change-password',
  validate({ body: z.object({ currentPassword: z.string(), newPassword: passwordRule }) }),
  c.changePassword);

module.exports = router;
