const { SHIPPING_OPTIONS } = require('../config/shipping');

function getOptions(req, res) {
  res.json(SHIPPING_OPTIONS);
}

module.exports = { getOptions };
