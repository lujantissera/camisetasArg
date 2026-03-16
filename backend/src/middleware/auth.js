const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const { getDB } = require('../db/database');

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
});

// Auto-create customer in local DB on first authenticated request
function ensureCustomer(req, res, next) {
  try {
    const auth0Id = req.auth.sub;
    const db = getDB();

    let customer = db.prepare('SELECT * FROM customers WHERE auth0_id = ?').get(auth0Id);

    if (!customer) {
      // Auth0 can include email/name via custom actions (see README)
      const email = req.auth.email || req.auth[`${process.env.AUTH0_AUDIENCE}/email`] || '';
      const name = req.auth.name || req.auth.nickname || '';

      const result = db.prepare(
        'INSERT INTO customers (auth0_id, email, name) VALUES (?, ?, ?)'
      ).run(auth0Id, email, name);

      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    }

    req.customer = customer;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { checkJwt, ensureCustomer };
