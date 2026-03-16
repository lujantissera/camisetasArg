const customersService = require('../services/customers.service');

function getMe(req, res) {
  res.json(req.customer);
}

function updateMe(req, res) {
  const updated = customersService.updateCustomer(req.customer.id, req.body, req.customer);
  res.json(updated);
}

module.exports = { getMe, updateMe };
