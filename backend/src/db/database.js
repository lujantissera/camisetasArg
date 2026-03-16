const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../../data');
const DB_PATH = path.join(DATA_DIR, 'shop.db');

let db;

function getDB() {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      auth0_id   TEXT UNIQUE NOT NULL,
      email      TEXT NOT NULL DEFAULT '',
      name       TEXT,
      phone      TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      category    TEXT DEFAULT 'jersey',
      image_url   TEXT,
      price       REAL NOT NULL DEFAULT 20.0,
      active      INTEGER DEFAULT 1,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      size       TEXT NOT NULL CHECK(size IN ('S','M','L','XL')),
      stock      INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(product_id, size)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id               INTEGER NOT NULL,
      status                    TEXT NOT NULL DEFAULT 'draft'
                                  CHECK(status IN ('draft','pending_payment','paid','shipped','cancelled')),
      shipping_method           TEXT CHECK(shipping_method IN ('free','standard','express')),
      shipping_address          TEXT,
      subtotal                  REAL NOT NULL DEFAULT 0,
      shipping_cost             REAL NOT NULL DEFAULT 0,
      total                     REAL NOT NULL DEFAULT 0,
      stripe_payment_intent_id  TEXT,
      stripe_client_secret      TEXT,
      created_at                DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at                DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   INTEGER NOT NULL,
      variant_id INTEGER NOT NULL,
      quantity   INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    );
  `);

  console.log('✅ Database initialized');
  return db;
}

module.exports = { getDB, initDB };
