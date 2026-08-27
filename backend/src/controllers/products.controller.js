const productsService = require('../services/products.service');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const products = await productsService.getAllProducts();
  res.json(products);
});

const getById = asyncHandler(async (req, res) => {
  const product = await productsService.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

module.exports = { getAll, getById };
