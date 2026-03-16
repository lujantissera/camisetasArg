const ordersService = require('../services/orders.service');

function create(req, res) {
  const order = ordersService.createOrder(req.customer.id);
  res.status(201).json(order);
}

function list(req, res) {
  const orders = ordersService.listOrders(req.customer.id);
  res.json(orders);
}

function getOne(req, res) {
  const order = ordersService.getOrder(req.params.id, req.customer.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
}

function addItem(req, res) {
  const { variantId, quantity = 1 } = req.body;
  if (!variantId) return res.status(400).json({ error: 'variantId is required' });

  const result = ordersService.addItem(req.params.id, req.customer.id, variantId, quantity);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function removeItem(req, res) {
  const result = ordersService.removeItem(req.params.id, req.customer.id, req.params.itemId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function updateItem(req, res) {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity >= 1 required' });

  const result = ordersService.updateItemQuantity(req.params.id, req.customer.id, req.params.itemId, quantity);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

function setShipping(req, res) {
  const { shippingMethod, shippingAddress } = req.body;
  const result = ordersService.setShipping(req.params.id, req.customer.id, shippingMethod, shippingAddress);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
}

async function confirm(req, res) {
  try {
    const result = await ordersService.confirmOrder(req.params.id, req.customer.id);
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.json(result.data);
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Payment processing error', detail: err.message });
  }
}

module.exports = { create, list, getOne, addItem, removeItem, updateItem, setShipping, confirm };
