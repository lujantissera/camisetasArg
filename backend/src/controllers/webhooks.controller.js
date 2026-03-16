const { getDB } = require('../db/database');

async function handleStripeWebhook(req, res) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const db = getDB();

    const order = db
      .prepare('SELECT * FROM orders WHERE stripe_payment_intent_id=?')
      .get(paymentIntent.id);

    if (order) {
      db.prepare(
        'UPDATE orders SET status="paid", updated_at=CURRENT_TIMESTAMP WHERE id=?'
      ).run(order.id);

      const items = db
        .prepare('SELECT variant_id, quantity FROM order_items WHERE order_id=?')
        .all(order.id);

      const deductStock = db.prepare(
        'UPDATE product_variants SET stock=stock-? WHERE id=? AND stock>=?'
      );
      const deductAll = db.transaction(rows => {
        for (const row of rows) deductStock.run(row.quantity, row.variant_id, row.quantity);
      });
      deductAll(items);
    }
  }

  res.json({ received: true });
}

module.exports = { handleStripeWebhook };
