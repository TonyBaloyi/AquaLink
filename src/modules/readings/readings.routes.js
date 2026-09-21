const router = require('express').Router();
const { z } = require('zod');
const validate = require('../../middleware/validate');
const { authenticate, withSupplier, withHousehold, deviceAuth } = require('../../middleware/auth');
const c = require('./readings.controller');

const readingSchema = z.object({
  serial_number: z.string().min(3),
  litres_supplied: z.coerce.number().nonnegative().optional(),
  water_level_percent: z.coerce.number().min(0).max(100).optional(),
  recorded_at: z.string().datetime().optional(),
});

// IoT layer ingestion - device key, no JWT
router.post('/', deviceAuth, validate({ body: readingSchema }), c.ingest);
router.post('/batch', deviceAuth,
  validate({ body: z.object({ readings: z.array(readingSchema).min(1).max(500) }) }), c.ingestBatch);

// Dashboard queries
router.use(authenticate, withSupplier, withHousehold);
router.get('/', c.list);
router.get('/usage', c.usage);

module.exports = router;
