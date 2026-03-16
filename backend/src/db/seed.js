require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { initDB, getDB } = require('./database');

initDB();
const db = getDB();

// Clear existing data
db.prepare('DELETE FROM order_items').run();
db.prepare('DELETE FROM orders').run();
db.prepare('DELETE FROM product_variants').run();
db.prepare('DELETE FROM products').run();

const products = [
  {
    name: 'Camiseta Argentina Local 2024',
    description: 'La camiseta oficial de la Selección Argentina para la temporada 2024. Diseño icónico con las tres estrellas y la AFA. Tela de alta tecnología, idéntica a la del plantel.',
    image_url: 'https://images.unsplash.com/photo-1598970605070-a38a6ccd3a2d?w=600&q=80',
    price: 20.0,
  },
  {
    name: 'Camiseta Argentina Visitante 2024',
    description: 'La alternativa oscura de la Selección. Diseño moderno en tonos profundos con detalles celestes y dorados. Perfecta para los partidos de visitante.',
    image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80',
    price: 20.0,
  },
  {
    name: 'Camiseta Argentina Copa América Campeón',
    description: 'Edición especial conmemorativa del tricampeonato de la Copa América 2024. Parche de campeón incluido. Edición limitada.',
    image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=80',
    price: 20.0,
  },
];

const insertProduct = db.prepare(
  'INSERT INTO products (name, description, image_url, price) VALUES (?, ?, ?, ?)'
);
const insertVariant = db.prepare(
  'INSERT INTO product_variants (product_id, size, stock) VALUES (?, ?, ?)'
);
const SIZES = ['S', 'M', 'L', 'XL'];

const seedAll = db.transaction(() => {
  for (const p of products) {
    const { lastInsertRowid } = insertProduct.run(p.name, p.description, p.image_url, p.price);
    for (const size of SIZES) {
      insertVariant.run(lastInsertRowid, size, 50);
    }
  }
});

seedAll();
console.log(`✅ Seeded ${products.length} products with sizes S/M/L/XL (50 units each)`);
