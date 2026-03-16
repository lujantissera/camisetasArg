const { getDB } = require('../db/database');

function getCustomerById(customerId) {
  const db = getDB();
  return db.prepare('SELECT * FROM customers WHERE id=?').get(customerId);
}

function updateCustomer(customerId, { name, phone }, currentCustomer) {
  const db = getDB();
  db.prepare(
    'UPDATE customers SET name=?, phone=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(name || currentCustomer.name, phone || currentCustomer.phone, customerId);
  return getCustomerById(customerId);
}

module.exports = { getCustomerById, updateCustomer };
