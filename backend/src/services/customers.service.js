const { getDB } = require('../db/database');

async function getCustomerById(customerId) {
  const db = getDB();
  const { rows } = await db.execute({ sql: 'SELECT * FROM customers WHERE id=?', args: [customerId] });
  return rows[0] || null;
}

async function findOrCreateByAuth0Id(auth0Id, { email = '', name = '' } = {}) {
  const db = getDB();
  const { rows } = await db.execute({ sql: 'SELECT * FROM customers WHERE auth0_id = ?', args: [auth0Id] });
  if (rows[0]) return rows[0];

  const result = await db.execute({
    sql: 'INSERT INTO customers (auth0_id, email, name) VALUES (?, ?, ?)',
    args: [auth0Id, email, name],
  });
  return getCustomerById(Number(result.lastInsertRowid));
}

async function updateCustomer(customerId, { name, phone }, currentCustomer) {
  const db = getDB();
  await db.execute({
    sql: 'UPDATE customers SET name=?, phone=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
    args: [name || currentCustomer.name, phone || currentCustomer.phone, customerId],
  });
  return getCustomerById(customerId);
}

module.exports = { getCustomerById, findOrCreateByAuth0Id, updateCustomer };
