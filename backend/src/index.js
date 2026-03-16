require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');
const { checkJwt, ensureCustomer } = require('./middleware/auth');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const customersRouter = require('./routes/customers');
const paymentsRouter = require('./routes/payments');
const webhooksController = require('./controllers/webhooks.controller');

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook MUST receive raw body — register before express.json()
app.post('/api/webhook', express.raw({ type: 'application/json' }), webhooksController.handleStripeWebhook);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

initDB();

// Public
app.use('/api/products', productsRouter);

// Protected
app.use('/api/orders',    checkJwt, ensureCustomer, ordersRouter);
app.use('/api/customers', checkJwt, ensureCustomer, customersRouter);
app.use('/api/payments',  checkJwt, ensureCustomer, paymentsRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Error handler
app.use((err, _req, res, _next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized', detail: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
