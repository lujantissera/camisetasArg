const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const customersService = require('../services/customers.service');

// credentialsRequired: false -> si viene un token lo valida, si no viene sigue sin error (invitado).
// Si viene un token inválido, sí falla (evita aceptar tokens rotos silenciosamente).
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
  credentialsRequired: false,
});

// Adjunta req.customer si hay sesión Auth0 válida, y req.guestToken si el cliente mandó uno
// (header X-Guest-Token, generado por el backend al crear un pedido como invitado).
// Nunca corta la request: el checkout debe funcionar logueado o no.
async function attachCustomer(req, res, next) {
  try {
    req.guestToken = req.headers['x-guest-token'] || null;

    if (req.auth?.sub) {
      const email = req.auth.email || req.auth[`${process.env.AUTH0_AUDIENCE}/email`] || '';
      const name = req.auth.name || req.auth.nickname || '';
      req.customer = await customersService.findOrCreateByAuth0Id(req.auth.sub, { email, name });
    } else {
      req.customer = null;
    }

    next();
  } catch (err) {
    next(err);
  }
}

// Para rutas que sí necesitan cuenta (historial de pedidos, perfil) — se monta después de attachCustomer.
function requireAuth(req, res, next) {
  if (!req.customer) {
    return res.status(401).json({ error: 'Se requiere iniciar sesión' });
  }
  next();
}

module.exports = { checkJwt, attachCustomer, requireAuth };
