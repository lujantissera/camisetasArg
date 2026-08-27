// Express 4 no atrapa rechazos de promesas en route handlers async — este wrapper los pasa a next(err).
module.exports = fn => (req, res, next) => fn(req, res, next).catch(next);
