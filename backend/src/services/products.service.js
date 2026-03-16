const { getDB } = require('../db/database');

const SIZE_ORDER = { S: 1, M: 2, L: 3, XL: 4 };

function getAllProducts() {
  const db = getDB();
  const products = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY id').all();
  const getVariants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?');

  return products.map(p => ({
    ...p,
    variants: getVariants.all(p.id).sort((a, b) => SIZE_ORDER[a.size] - SIZE_ORDER[b.size]),
  }));
}

function getProductById(id) {
  const db = getDB();
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(id);
  if (!product) return null;

  const variants = db
    .prepare('SELECT * FROM product_variants WHERE product_id = ?')
    .all(product.id)
    .sort((a, b) => SIZE_ORDER[a.size] - SIZE_ORDER[b.size]);

  return { ...product, variants };
}

module.exports = { getAllProducts, getProductById };
