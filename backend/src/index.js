require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/database');
const { checkJwt, attachCustomer, requireAuth } = require('./middleware/auth');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const customersRouter = require('./routes/customers');
const paymentsRouter = require('./routes/payments');
const shippingRouter = require('./routes/shipping');
const webhooksController = require('./controllers/webhooks.controller');

const app = express();
const PORT = process.env.PORT || 3001;

// Stripe webhook MUST receive raw body — register before express.json()
app.post('/api/webhook', express.raw({ type: 'application/json' }), webhooksController.handleStripeWebhook);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

initDB().catch(err => {
  console.error('❌ No se pudo inicializar la base de datos:', err);
  process.exit(1);
});

// Público — no requieren sesión ni invitado
app.use('/api/products', productsRouter);
app.use('/api/payments', paymentsRouter); // solo expone la publishable key de Stripe
app.use('/api/shipping-options', shippingRouter);

// Auth opcional: adjunta req.customer si hay sesión Auth0, sigue sin ella si no (invitado).
// Cada router decide internamente qué rutas exigen requireAuth (ver routes/orders.js y routes/customers.js).
app.use('/api/orders', checkJwt, attachCustomer, ordersRouter);
app.use('/api/customers', checkJwt, attachCustomer, requireAuth, customersRouter); // perfil: siempre requiere cuenta

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
