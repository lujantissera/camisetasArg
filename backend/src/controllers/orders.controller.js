const ordersService = require('../services/orders.service');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const customerId = req.customer?.id || null;

  if (!customerId) {
    const { guestEmail, guestName, guestPhone } = req.body || {};
    if (!guestEmail) {
      return res.status(400).json({ error: 'guestEmail es requerido para comprar como invitado' });
    }
    const order = await ordersService.createOrder(null, { email: guestEmail, name: guestName, phone: guestPhone });
    return res.status(201).json(order);
  }

  const order = await ordersService.createOrder(customerId, null);
  res.status(201).json(order);
});

const list = asyncHandler(async (req, res) => {
  const orders = await ordersService.listOrders(req.customer.id);
  res.json(orders);
});

const getOne = asyncHandler(async (req, res) => {
  const order = await ordersService.getOrder(req.params.id, req.customer?.id, req.guestToken);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

const addItem = asyncHandler(async (req, res) => {
  const { variantId, quantity = 1 } = req.body;
  if (!variantId) return res.status(400).json({ error: 'variantId is required' });

  const result = await ordersService.addItem(req.params.id, req.customer?.id, req.guestToken, variantId, quantity);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

const removeItem = asyncHandler(async (req, res) => {
  const result = await ordersService.removeItem(req.params.id, req.customer?.id, req.guestToken, req.params.itemId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity >= 1 required' });

  const result = await ordersService.updateItemQuantity(
    req.params.id, req.customer?.id, req.guestToken, req.params.itemId, quantity
  );
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

const setShipping = asyncHandler(async (req, res) => {
  const { shippingMethod, shippingAddress } = req.body;
  const result = await ordersService.setShipping(
    req.params.id, req.customer?.id, req.guestToken, shippingMethod, shippingAddress
  );
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json(result.data);
});

const confirm = asyncHandler(async (req, res) => {
  try {
    const result = await ordersService.confirmOrder(req.params.id, req.customer?.id, req.guestToken);
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.json(result.data);
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Payment processing error', detail: err.message });
  }
});

module.exports = { create, list, getOne, addItem, removeItem, updateItem, setShipping, confirm };
