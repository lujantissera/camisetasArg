const productsService = require('../services/products.service');

function getAll(req, res) {
  const products = productsService.getAllProducts();
  res.json(products);
}

function getById(req, res) {
  const product = productsService.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
}

module.exports = { getAll, getById };
