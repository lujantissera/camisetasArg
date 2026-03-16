const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');

router.get('/config', paymentsController.getConfig);

module.exports = router;
