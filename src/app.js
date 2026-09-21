const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ---- RESTful API Gateway (Core Services) ----
app.use(helmet());
app.use(cors({
  origin: env.corsOrigin.includes('*') ? true : env.corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
if (env.nodeEnv !== 'test') app.use(morgan('dev'));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));
app.use('/api/v1/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use(env.apiPrefix, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
