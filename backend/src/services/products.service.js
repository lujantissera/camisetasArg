const { getDB, withTransaction } = require('../db/database');
const { ONDEMAND_SIZES, ONDEMAND_STOCK } = require('../scraper/config');

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

// Upsert transaccional del catálogo on-demand scrapeado, por source_url. Nunca borra un
// producto ni recrea el id de una variante existente — un pedido histórico puede referenciar
// esos ids vía order_items (sin ON DELETE CASCADE). Los productos que ya no aparecen en la
// corrida actual se marcan active=0 en vez de borrarse (mismo mecanismo que ya usa
// getAllProducts/getProductById para no listarlos).
async function upsertOnDemandCatalog(scrapedProducts) {
  const seenUrls = scrapedProducts.map(p => p.sourceUrl);

  return withTransaction(async tx => {
    const summary = { inserted: 0, updated: 0, deactivated: 0 };

    for (const p of scrapedProducts) {
      const { rows } = await tx.execute({ sql: 'SELECT id FROM products WHERE source_url = ?', args: [p.sourceUrl] });
      const existing = rows[0];
      let productId;

      if (existing) {
        productId = existing.id;
        await tx.execute({
          sql: `UPDATE products SET name=?, club=?, version=?, image_urls=?, price=?, active=1 WHERE id=?`,
          args: [p.name, p.club, p.version, JSON.stringify(p.imageUrls), p.price, productId],
        });
        summary.updated++;
      } else {
        const result = await tx.execute({
          sql: `INSERT INTO products (name, description, club, category, version, type, source_url, image_urls, price, active)
                VALUES (?, ?, ?, 'camiseta', ?, 'on_demand', ?, ?, ?, 1)`,
          args: [p.name, null, p.club, p.version, p.sourceUrl, JSON.stringify(p.imageUrls), p.price],
        });
        productId = Number(result.lastInsertRowid);
        summary.inserted++;
      }

      for (const size of ONDEMAND_SIZES) {
        await tx.execute({
          sql: `INSERT INTO product_variants (product_id, size, stock) VALUES (?, ?, ?)
                ON CONFLICT(product_id, size) DO UPDATE SET stock=excluded.stock`,
          args: [productId, size, ONDEMAND_STOCK],
        });
      }
    }

    const placeholders = seenUrls.map(() => '?').join(',');
    const { rowsAffected } = await tx.execute({
      sql: `UPDATE products SET active=0 WHERE type='on_demand' AND source_url IS NOT NULL
            ${seenUrls.length ? `AND source_url NOT IN (${placeholders})` : ''}`,
      args: seenUrls,
    });
    summary.deactivated = rowsAffected;

    return summary;
  });
}

module.exports = { getAllProducts, getProductById, upsertOnDemandCatalog };
