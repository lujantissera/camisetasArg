require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { getDB, initDB, withTransaction } = require('./database');

// Catálogo real de stock instantáneo (ver Requisitos.md §3.1). Precio 25€ es un placeholder
// parejo a ajustar cuando definan precios reales por producto.
const products = [
  {
    name: 'River 125th',
    club: 'River Plate',
    category: 'camiseta',
    version: 'retro',
    description: 'Camiseta conmemorativa del 125° aniversario de River Plate.',
    price: 25.0,
    variants: [
      { size: 'M', stock: 1 },
      { size: 'XXL', stock: 3 },
    ],
  },
  {
    name: 'River Home Player Version',
    club: 'River Plate',
    category: 'camiseta',
    version: 'titular',
    description: 'Camiseta titular 2026 de River Plate, versión jugador.',
    price: 25.0,
    variants: [
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 },
      { size: 'XXL', stock: 1 },
    ],
  },
  {
    name: 'Racing Home Player Version',
    club: 'Racing Club',
    category: 'camiseta',
    version: 'titular',
    description: 'Camiseta titular 2026 de Racing Club, versión jugador.',
    price: 25.0,
    variants: [
      { size: 'L', stock: 1 },
      { size: 'XL', stock: 1 },
      { size: 'XXL', stock: 1 },
    ],
  },
  {
    name: 'Racing Home Retro',
    club: 'Racing Club',
    category: 'camiseta',
    version: 'retro',
    description: 'Camiseta retro de Racing Club.',
    price: 25.0,
    variants: [{ size: 'XL', stock: 1 }],
  },
  {
    name: 'Slo Home',
    club: 'San Lorenzo',
    category: 'camiseta',
    version: 'titular',
    description: 'Camiseta titular de San Lorenzo de Almagro.',
    price: 25.0,
    variants: [{ size: 'XL', stock: 1 }],
  },
  {
    name: 'Slo Away',
    club: 'San Lorenzo',
    category: 'camiseta',
    version: 'suplente',
    description: 'Camiseta suplente de San Lorenzo de Almagro.',
    price: 25.0,
    variants: [{ size: 'XXL', stock: 1 }],
  },
];

async function seed() {
  await initDB();

  await withTransaction(async tx => {
    // Orden FK-safe
    await tx.execute('DELETE FROM order_items');
    await tx.execute('DELETE FROM orders');
    await tx.execute('DELETE FROM product_variants');
    await tx.execute('DELETE FROM products');

    for (const p of products) {
      const result = await tx.execute({
        sql: `INSERT INTO products (name, description, club, category, version, price)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [p.name, p.description, p.club, p.category, p.version, p.price],
      });
      const productId = Number(result.lastInsertRowid);

      for (const v of p.variants) {
        await tx.execute({
          sql: 'INSERT INTO product_variants (product_id, size, stock) VALUES (?, ?, ?)',
          args: [productId, v.size, v.stock],
        });
      }
    }
  });

  console.log(`✅ Seeded ${products.length} productos reales (River Plate, San Lorenzo, Racing Club)`);
}

seed()
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => getDB().close?.());
