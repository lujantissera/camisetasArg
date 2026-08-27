const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../../data');
const DB_PATH = path.join(DATA_DIR, 'shop.db');

let client;

function getDB() {
  if (!client) {
    const url = process.env.LIBSQL_URL;
    if (url) {
      client = createClient({ url, authToken: process.env.LIBSQL_AUTH_TOKEN });
    } else {
      // Dev local: sin LIBSQL_URL, usa un archivo SQLite local (sin depender de Turso).
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      client = createClient({ url: `file:${DB_PATH}` });
    }
  }
  return client;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS customers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    auth0_id   TEXT UNIQUE NOT NULL,
    email      TEXT NOT NULL DEFAULT '',
    name       TEXT,
    phone      TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    club        TEXT,
    category    TEXT NOT NULL DEFAULT 'camiseta' CHECK(category IN ('camiseta','short','entrenamiento')),
    version     TEXT,
    type        TEXT NOT NULL DEFAULT 'stock' CHECK(type IN ('stock','on_demand')),
    source_url  TEXT,
    image_urls  TEXT NOT NULL DEFAULT '[]',
    price       REAL NOT NULL DEFAULT 25.0,
    active      INTEGER DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS product_variants (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    size       TEXT NOT NULL CHECK(size IN ('XS','S','M','L','XL','XXL','XXXL')),
    stock      INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE(product_id, size)
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id               INTEGER,
    guest_email               TEXT,
    guest_name                TEXT,
    guest_phone                TEXT,
    guest_token               TEXT,
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
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    CHECK (customer_id IS NOT NULL OR guest_email IS NOT NULL)
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id   INTEGER NOT NULL,
    variant_id INTEGER NOT NULL,
    quantity   INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
  )`,
];

async function initDB() {
  const db = getDB();
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement);
  }
  console.log('✅ Database initialized');
  return db;
}

// Envuelve fn(tx) en una transacción libSQL. Usar tx.execute(...) adentro, no getDB().
async function withTransaction(fn) {
  const db = getDB();
  const tx = await db.transaction('write');
  try {
    const result = await fn(tx);
    await tx.commit();
    return result;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

module.exports = { getDB, initDB, withTransaction };
