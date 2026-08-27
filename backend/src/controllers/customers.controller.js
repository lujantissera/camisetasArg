const customersService = require('../services/customers.service');
const asyncHandler = require('../utils/asyncHandler');

function getMe(req, res) {
  res.json(req.customer);
}

const updateMe = asyncHandler(async (req, res) => {
  const updated = await customersService.updateCustomer(req.customer.id, req.body, req.customer);
  res.json(updated);
});

module.exports = { getMe, updateMe };
