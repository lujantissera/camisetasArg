const crypto = require('crypto');
const { getDB } = require('../db/database');
const { SHIPPING_COSTS } = require('../config/shipping');

// Un pedido pertenece al customer autenticado, o a quien tenga el guest_token — nunca a ambos.
function ownershipClause() {
  return '(customer_id = ? OR guest_token = ?)';
}

async function recalcOrder(db, orderId) {
  const { rows: items } = await db.execute({
    sql: 'SELECT quantity, unit_price FROM order_items WHERE order_id = ?',
    args: [orderId],
  });

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const { rows } = await db.execute({ sql: 'SELECT shipping_method FROM orders WHERE id = ?', args: [orderId] });
  const shippingMethod = rows[0]?.shipping_method;
  const shippingCost = shippingMethod != null ? (SHIPPING_COSTS[shippingMethod] ?? 0) : 0;

  await db.execute({
    sql: 'UPDATE orders SET subtotal=?, shipping_cost=?, total=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    args: [subtotal, shippingCost, subtotal + shippingCost, orderId],
  });
}

async function getFullOrder(orderId) {
  const db = getDB();
  const { rows: orderRows } = await db.execute({ sql: 'SELECT * FROM orders WHERE id = ?', args: [orderId] });
  const order = orderRows[0];
  if (!order) return null;

  const { rows: items } = await db.execute({
    sql: `SELECT oi.id, oi.quantity, oi.unit_price,
                 pv.size,
                 p.id AS product_id, p.name AS product_name, p.club, p.image_url
          FROM order_items oi
          JOIN product_variants pv ON oi.variant_id = pv.id
          JOIN products p ON pv.product_id = p.id
          WHERE oi.order_id = ?`,
    args: [orderId],
  });

  return { ...order, items };
}

async function createOrder(customerId, guestInfo) {
  const db = getDB();
  const guestToken = customerId ? null : crypto.randomUUID();

  const result = await db.execute({
    sql: `INSERT INTO orders (customer_id, guest_email, guest_name, guest_phone, guest_token, status)
          VALUES (?, ?, ?, ?, ?, 'draft')`,
    args: [
      customerId || null,
      guestInfo?.email || null,
      guestInfo?.name || null,
      guestInfo?.phone || null,
      guestToken,
    ],
  });

  return getFullOrder(Number(result.lastInsertRowid));
}

async function listOrders(customerId) {
  const db = getDB();
  const { rows } = await db.execute({
    sql: 'SELECT id FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
    args: [customerId],
  });
  return Promise.all(rows.map(o => getFullOrder(o.id)));
}

async function getOrder(orderId, customerId, guestToken) {
  const db = getDB();
  const { rows } = await db.execute({
    sql: `SELECT id FROM orders WHERE id = ? AND ${ownershipClause()}`,
    args: [orderId, customerId || null, guestToken || null],
  });
  if (!rows[0]) return null;
  return getFullOrder(rows[0].id);
}

async function findDraftOrder(db, orderId, customerId, guestToken) {
  const { rows } = await db.execute({
    sql: `SELECT * FROM orders WHERE id=? AND ${ownershipClause()} AND status='draft'`,
    args: [orderId, customerId || null, guestToken || null],
  });
  return rows[0] || null;
}

async function addItem(orderId, customerId, guestToken, variantId, quantity = 1) {
  const db = getDB();
  const order = await findDraftOrder(db, orderId, customerId, guestToken);
  if (!order) return { error: 'Draft order not found', status: 404 };

  const { rows: variantRows } = await db.execute({
    sql: 'SELECT pv.*, p.price FROM product_variants pv JOIN products p ON pv.product_id=p.id WHERE pv.id=?',
    args: [variantId],
  });
  const variant = variantRows[0];
  if (!variant) return { error: 'Variant not found', status: 404 };
  if (variant.stock < quantity) return { error: 'Insufficient stock', status: 400 };

  const { rows: existingRows } = await db.execute({
    sql: 'SELECT * FROM order_items WHERE order_id=? AND variant_id=?',
    args: [order.id, variantId],
  });
  const existing = existingRows[0];

  if (existing) {
    await db.execute({
      sql: 'UPDATE order_items SET quantity=quantity+? WHERE id=?',
      args: [quantity, existing.id],
    });
  } else {
    await db.execute({
      sql: 'INSERT INTO order_items (order_id, variant_id, quantity, unit_price) VALUES (?,?,?,?)',
      args: [order.id, variantId, quantity, variant.price],
    });
  }

  await recalcOrder(db, order.id);
  return { data: await getFullOrder(order.id) };
}

async function removeItem(orderId, customerId, guestToken, itemId) {
  const db = getDB();
  const order = await findDraftOrder(db, orderId, customerId, guestToken);
  if (!order) return { error: 'Draft order not found', status: 404 };

  await db.execute({ sql: 'DELETE FROM order_items WHERE id=? AND order_id=?', args: [itemId, order.id] });
  await recalcOrder(db, order.id);
  return { data: await getFullOrder(order.id) };
}

async function updateItemQuantity(orderId, customerId, guestToken, itemId, quantity) {
  const db = getDB();
  const order = await findDraftOrder(db, orderId, customerId, guestToken);
  if (!order) return { error: 'Draft order not found', status: 404 };

  const { rows } = await db.execute({
    sql: `SELECT oi.*, pv.stock FROM order_items oi JOIN product_variants pv ON oi.variant_id=pv.id
          WHERE oi.id=? AND oi.order_id=?`,
    args: [itemId, order.id],
  });
  const item = rows[0];
  if (!item) return { error: 'Item not found', status: 404 };
  if (item.stock < quantity) return { error: 'Insufficient stock', status: 400 };

  await db.execute({ sql: 'UPDATE order_items SET quantity=? WHERE id=?', args: [quantity, item.id] });
  await recalcOrder(db, order.id);
  return { data: await getFullOrder(order.id) };
}

async function setShipping(orderId, customerId, guestToken, shippingMethod, shippingAddress) {
  if (!Object.prototype.hasOwnProperty.call(SHIPPING_COSTS, shippingMethod)) {
    return { error: 'Invalid shippingMethod. Use: free, standard, express', status: 400 };
  }

  const db = getDB();
  const order = await findDraftOrder(db, orderId, customerId, guestToken);
  if (!order) return { error: 'Draft order not found', status: 404 };

  await db.execute({
    sql: 'UPDATE orders SET shipping_method=?, shipping_address=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    args: [shippingMethod, JSON.stringify(shippingAddress || {}), order.id],
  });

  await recalcOrder(db, order.id);
  return { data: await getFullOrder(order.id) };
}

async function confirmOrder(orderId, customerId, guestToken) {
  const db = getDB();
  const order = await findDraftOrder(db, orderId, customerId, guestToken);
  if (!order) return { error: 'Draft order not found', status: 404 };
  if (!order.shipping_method) return { error: 'Shipping method required', status: 400 };

  const { rows: items } = await db.execute({ sql: 'SELECT * FROM order_items WHERE order_id=?', args: [order.id] });
  if (!items.length) return { error: 'Cannot confirm empty order', status: 400 };

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: 'eur',
    receipt_email: order.guest_email || undefined,
    metadata: { orderId: String(order.id), customerId: customerId ? String(customerId) : 'guest' },
  });

  await db.execute({
    sql: `UPDATE orders SET status='pending_payment', stripe_payment_intent_id=?, stripe_client_secret=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    args: [paymentIntent.id, paymentIntent.client_secret, order.id],
  });

  return { data: { order: await getFullOrder(order.id), clientSecret: paymentIntent.client_secret } };
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
