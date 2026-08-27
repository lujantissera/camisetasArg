const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/', ordersController.create);
router.get('/', requireAuth, ordersController.list); // historial de pedidos: solo con cuenta
router.get('/:id', ordersController.getOne);
router.post('/:id/items', ordersController.addItem);
router.delete('/:id/items/:itemId', ordersController.removeItem);
router.put('/:id/items/:itemId', ordersController.updateItem);
router.put('/:id/shipping', ordersController.setShipping);
router.post('/:id/confirm', ordersController.confirm);

module.exports = router;
