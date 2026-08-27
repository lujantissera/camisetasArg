const { getDB } = require('../db/database');

const SIZE_ORDER = { XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6, XXXL: 7 };
const bySize = (a, b) => (SIZE_ORDER[a.size] || 99) - (SIZE_ORDER[b.size] || 99);

function withParsedImages(product) {
  let image_urls = [];
  try {
    image_urls = JSON.parse(product.image_urls || '[]');
  } catch {
    image_urls = [];
  }
  return { ...product, image_urls };
}

async function getAllProducts() {
  const db = getDB();
  const { rows: products } = await db.execute('SELECT * FROM products WHERE active = 1 ORDER BY id');
  if (products.length === 0) return [];

  const ids = products.map(p => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const { rows: variants } = await db.execute({
    sql: `SELECT * FROM product_variants WHERE product_id IN (${placeholders})`,
    args: ids,
  });

  const variantsByProduct = {};
  for (const v of variants) {
    (variantsByProduct[v.product_id] ??= []).push(v);
  }

  return products.map(p => ({
    ...withParsedImages(p),
    variants: (variantsByProduct[p.id] || []).sort(bySize),
  }));
}

async function getProductById(id) {
  const db = getDB();
  const { rows } = await db.execute({ sql: 'SELECT * FROM products WHERE id = ? AND active = 1', args: [id] });
  const product = rows[0];
  if (!product) return null;

  const { rows: variants } = await db.execute({
    sql: 'SELECT * FROM product_variants WHERE product_id = ?',
    args: [product.id],
  });

  return { ...withParsedImages(product), variants: variants.sort(bySize) };
}

module.exports = { getAllProducts, getProductById };
