const { getDB } = require('../db/database');

const SHIPPING_COSTS = { free: 0, standard: 5, express: 12 };

function recalcOrder(db, orderId) {
  const items = db
    .prepare('SELECT quantity, unit_price FROM order_items WHERE order_id = ?')
    .all(orderId);

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const order = db.prepare('SELECT shipping_method FROM orders WHERE id = ?').get(orderId);
  const shippingCost =
    order?.shipping_method != null ? (SHIPPING_COSTS[order.shipping_method] ?? 0) : 0;

  db.prepare(
    'UPDATE orders SET subtotal=?, shipping_cost=?, total=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(subtotal, shippingCost, subtotal + shippingCost, orderId);
}

function getFullOrder(orderId) {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;

  const items = db
    .prepare(
      `SELECT oi.id, oi.quantity, oi.unit_price,
              pv.size,
              p.id AS product_id, p.name AS product_name, p.image_url
       FROM order_items oi
       JOIN product_variants pv ON oi.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE oi.order_id = ?`
    )
    .all(orderId);

  return { ...order, items };
}

function createOrder(customerId) {
  const db = getDB();
  const { lastInsertRowid } = db
    .prepare('INSERT INTO orders (customer_id, status) VALUES (?, "draft")')
    .run(customerId);
  return getFullOrder(lastInsertRowid);
}

function listOrders(customerId) {
  const db = getDB();
  const orders = db
    .prepare('SELECT id FROM orders WHERE customer_id = ? ORDER BY created_at DESC')
    .all(customerId);
  return orders.map(o => getFullOrder(o.id));
}

function getOrder(orderId, customerId) {
  const db = getDB();
  const order = db
    .prepare('SELECT id FROM orders WHERE id = ? AND customer_id = ?')
    .get(orderId, customerId);
  if (!order) return null;
  return getFullOrder(order.id);
}

function addItem(orderId, customerId, variantId, quantity = 1) {
  const db = getDB();
  const order = db
    .prepare('SELECT * FROM orders WHERE id=? AND customer_id=? AND status="draft"')
    .get(orderId, customerId);
  if (!order) return { error: 'Draft order not found', status: 404 };

  const variant = db
    .prepare('SELECT pv.*, p.price FROM product_variants pv JOIN products p ON pv.product_id=p.id WHERE pv.id=?')
    .get(variantId);
  if (!variant) return { error: 'Variant not found', status: 404 };
  if (variant.stock < quantity) return { error: 'Insufficient stock', status: 400 };

  const existing = db
    .prepare('SELECT * FROM order_items WHERE order_id=? AND variant_id=?')
    .get(order.id, variantId);

  if (existing) {
    db.prepare('UPDATE order_items SET quantity=quantity+? WHERE id=?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO order_items (order_id, variant_id, quantity, unit_price) VALUES (?,?,?,?)')
      .run(order.id, variantId, quantity, variant.price);
  }

  recalcOrder(db, order.id);
  return { data: getFullOrder(order.id) };
}

function removeItem(orderId, customerId, itemId) {
  const db = getDB();
  const order = db
    .prepare('SELECT * FROM orders WHERE id=? AND customer_id=? AND status="draft"')
    .get(orderId, customerId);
  if (!order) return { error: 'Draft order not found', status: 404 };

  db.prepare('DELETE FROM order_items WHERE id=? AND order_id=?').run(itemId, order.id);
  recalcOrder(db, order.id);
  return { data: getFullOrder(order.id) };
}

function updateItemQuantity(orderId, customerId, itemId, quantity) {
  const db = getDB();
  const order = db
    .prepare('SELECT * FROM orders WHERE id=? AND customer_id=? AND status="draft"')
    .get(orderId, customerId);
  if (!order) return { error: 'Draft order not found', status: 404 };

  const item = db
    .prepare('SELECT oi.*, pv.stock FROM order_items oi JOIN product_variants pv ON oi.variant_id=pv.id WHERE oi.id=? AND oi.order_id=?')
    .get(itemId, order.id);
  if (!item) return { error: 'Item not found', status: 404 };
  if (item.stock < quantity) return { error: 'Insufficient stock', status: 400 };

  db.prepare('UPDATE order_items SET quantity=? WHERE id=?').run(quantity, item.id);
  recalcOrder(db, order.id);
  return { data: getFullOrder(order.id) };
}

function setShipping(orderId, customerId, shippingMethod, shippingAddress) {
  if (!Object.prototype.hasOwnProperty.call(SHIPPING_COSTS, shippingMethod)) {
    return { error: 'Invalid shippingMethod. Use: free, standard, express', status: 400 };
  }

  const db = getDB();
  const order = db
    .prepare('SELECT * FROM orders WHERE id=? AND customer_id=? AND status="draft"')
    .get(orderId, customerId);
  if (!order) return { error: 'Draft order not found', status: 404 };

  db.prepare(
    'UPDATE orders SET shipping_method=?, shipping_address=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(shippingMethod, JSON.stringify(shippingAddress || {}), order.id);

  recalcOrder(db, order.id);
  return { data: getFullOrder(order.id) };
}

async function confirmOrder(orderId, customerId) {
  const db = getDB();
  const order = db
    .prepare('SELECT * FROM orders WHERE id=? AND customer_id=? AND status="draft"')
    .get(orderId, customerId);
  if (!order) return { error: 'Draft order not found', status: 404 };
  if (!order.shipping_method) return { error: 'Shipping method required', status: 400 };

  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
  if (!items.length) return { error: 'Cannot confirm empty order', status: 400 };

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: 'eur',
    metadata: { orderId: String(order.id), customerId: String(customerId) },
  });

  db.prepare(
    `UPDATE orders SET status='pending_payment', stripe_payment_intent_id=?, stripe_client_secret=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
  ).run(paymentIntent.id, paymentIntent.client_secret, order.id);

  return { data: { order: getFullOrder(order.id), clientSecret: paymentIntent.client_secret } };
}

module.exports = {
  getFullOrder,
  createOrder,
  listOrders,
  getOrder,
  addItem,
  removeItem,
  updateItemQuantity,
  setShipping,
  confirmOrder,
};
