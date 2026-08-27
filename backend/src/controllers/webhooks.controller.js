const { getDB, withTransaction } = require('../db/database');

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

    const { rows } = await db.execute({
      sql: 'SELECT * FROM orders WHERE stripe_payment_intent_id=?',
      args: [paymentIntent.id],
    });
    const order = rows[0];

    if (order) {
      await withTransaction(async tx => {
        await tx.execute({
          sql: "UPDATE orders SET status='paid', updated_at=CURRENT_TIMESTAMP WHERE id=?",
          args: [order.id],
        });

        const { rows: items } = await tx.execute({
          sql: 'SELECT variant_id, quantity FROM order_items WHERE order_id=?',
          args: [order.id],
        });

        for (const item of items) {
          const result = await tx.execute({
            sql: 'UPDATE product_variants SET stock=stock-? WHERE id=? AND stock>=?',
            args: [item.quantity, item.variant_id, item.quantity],
          });
          if (result.rowsAffected === 0) {
            console.warn(
              `⚠️ Oversell evitado: orden ${order.id}, variante ${item.variant_id}, pedía ${item.quantity} pero no había stock suficiente.`
            );
          }
        }
      });
    }
  }

  res.json({ received: true });
}

module.exports = { handleStripeWebhook };
