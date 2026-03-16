const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers.controller');

router.get('/me', customersController.getMe);
router.put('/me', customersController.updateMe);

module.exports = router;
