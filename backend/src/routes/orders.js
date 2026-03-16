const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders.controller');

router.post('/', ordersController.create);
router.get('/', ordersController.list);
router.get('/:id', ordersController.getOne);
router.post('/:id/items', ordersController.addItem);
router.delete('/:id/items/:itemId', ordersController.removeItem);
router.put('/:id/items/:itemId', ordersController.updateItem);
router.put('/:id/shipping', ordersController.setShipping);
router.post('/:id/confirm', ordersController.confirm);

module.exports = router;
