# Camisetas Argentinas ⭐⭐⭐

E-commerce de camisetas de clubes argentinos (River Plate, San Lorenzo, Racing Club) importadas y vendidas en España. Stack completo con React, Node.js, Auth0 (opcional) y Stripe.

Checkout disponible **con cuenta o como invitado** — no hace falta loguearse para comprar.

---

## Stack tecnológico

| Capa          | Tecnología                                                  |
|---------------|---------------------------------------------------------------|
| Frontend      | React 18 + Vite + TailwindCSS, desplegado en Vercel          |
| Autenticación | Auth0 (OAuth 2.0 / OIDC) — **opcional**, checkout invitado disponible |
| Backend       | Node.js + Express, desplegado en Render                      |
| Base de datos | SQLite en la nube vía [Turso](https://turso.tech) (`@libsql/client`) — en dev local usa un archivo sin necesitar cuenta |
| Pagos         | Stripe (Payment Element)                                     |
| Envío         | Gratis / Estándar €5 / Express €12 (`GET /api/shipping-options`) |

Ver [Requisitos.md](./Requisitos.md) para el detalle de negocio y decisiones de producto.

---

## Estructura del proyecto

```
camisetasArg/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── shipping.js   # fuente única de verdad de opciones de envío
│   │   ├── db/
│   │   │   ├── database.js   # cliente libSQL + esquema + init + transacciones
│   │   │   └── seed.js       # catálogo real (6 productos)
│   │   ├── middleware/
│   │   │   └── auth.js       # Auth0 opcional (checkJwt + attachCustomer + requireAuth)
│   │   ├── utils/
│   │   │   └── asyncHandler.js
│   │   ├── scraper/           # catálogo on-demand (Yupoo → products con type='on_demand')
│   │   │   ├── config.js      # diccionarios ES↔ZH, categorías, precio/stock/entrega fijos
│   │   │   ├── yupooClient.js # fetch + cheerio del sitio fuente
│   │   │   ├── titleParser.js # título en chino → nombre/club/versión en español
│   │   │   ├── run.js         # orquestador (scrapeAndUpsert)
│   │   │   └── cli.js         # entrypoint de `npm run scrape`
│   │   ├── routes/
│   │   │   ├── products.js   # GET /api/products
│   │   │   ├── orders.js     # CRUD órdenes + confirm (invitado o cuenta)
│   │   │   ├── customers.js  # perfil del cliente (requiere cuenta)
│   │   │   ├── payments.js   # Stripe publishable key
│   │   │   ├── shipping.js   # opciones de envío
│   │   │   └── admin.js      # POST /api/admin/scrape (protegido, dispara el scraper)
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/CartContext.jsx
│   │   ├── components/Navbar.jsx
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Shop.jsx      # catálogo con filtro por club, talles dinámicos
│   │       ├── Cart.jsx
│   │       ├── Checkout.jsx  # 2 pasos: dirección (+email) → Stripe, invitado o cuenta
│   │       └── Orders.jsx    # requiere cuenta
│   ├── .env.example
│   └── package.json
├── .github/workflows/
│   └── scrape-catalog.yml    # cron diario que dispara /api/admin/scrape
└── data/
    └── shop.db               # solo en dev local, creado automáticamente
```

---

## Configuración paso a paso

### 1. Turso (base de datos)

**En desarrollo no hace falta cuenta**: si `LIBSQL_URL` está vacío, el backend usa un archivo SQLite local (`data/shop.db`), igual que antes.

Para producción:
1. Creá una cuenta en [turso.tech](https://turso.tech) (plan gratis)
2. `turso db create camisetas-arg`
3. `turso db show camisetas-arg --url` → `LIBSQL_URL`
4. `turso db tokens create camisetas-arg` → `LIBSQL_AUTH_TOKEN`

### 2. Auth0 (opcional — solo si querés que los clientes puedan crear cuenta)

1. Creá una cuenta en [auth0.com](https://auth0.com)
2. Creá una **Single Page Application** → copiá `Domain` y `Client ID`
3. En *Allowed Callback URLs*: `http://localhost:5173`
4. En *Allowed Logout URLs*: `http://localhost:5173`
5. En *Allowed Web Origins*: `http://localhost:5173`
6. Creá una **API** → Identifier: `https://camisetas-arg-api`
7. **(Recomendado)** Para incluir email en el token, creá una Auth0 Action en **Login flow**:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = event.resource_server?.identifier || '';
  api.accessToken.setCustomClaim(`${namespace}/email`, event.user.email);
};
```

### 3. Stripe

1. Creá una cuenta en [stripe.com](https://stripe.com)
2. En modo **Test**, copiá `Publishable key` y `Secret key`
3. Para el webhook local instalá [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe login
stripe listen --forward-to http://localhost:3001/api/webhook
# Copiá el "webhook signing secret" que aparece (whsec_...)
```

### 4. Catálogo on-demand (scraping)

El scraper corre manual en dev (`npm run scrape`, ver más abajo) sin configuración extra. Para que corra solo todos los días en producción:

1. Generá un secreto random cualquiera (ej. `openssl rand -hex 24`) y ponelo como `SCRAPE_SECRET` en las variables de entorno de Render (el mismo valor que en `backend/.env`).
2. En GitHub: **Settings → Secrets and variables → Actions**, agregá:
   - `SCRAPE_SECRET` — el mismo valor de arriba.
   - `BACKEND_URL` — la URL pública del backend en Render (ej. `https://camisetas-arg-backend.onrender.com`, sin barra al final).
3. El workflow `.github/workflows/scrape-catalog.yml` ya está armado — corre todos los días a las 06:00 UTC, y también se puede disparar a mano desde la pestaña **Actions** de GitHub (`workflow_dispatch`).

### 5. Variables de entorno

**Backend** — copiar `.env.example` a `.env` y completar:
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
LIBSQL_URL=
LIBSQL_AUTH_TOKEN=
AUTH0_DOMAIN=tu-tenant.auth0.com
AUTH0_AUDIENCE=https://camisetas-arg-api
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SCRAPE_SECRET=cualquier-string-random-largo
```

**Frontend** — copiar `.env.example` a `.env` y completar:
```env
VITE_AUTH0_DOMAIN=tu-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=tu-client-id
VITE_AUTH0_AUDIENCE=https://camisetas-arg-api
```

---

## Instalación y ejecución

```bash
# Backend
cd backend
npm install
npm run seed       # poblar DB con el catálogo de stock (8 camisetas)
npm run scrape     # poblar/actualizar el catálogo on-demand (27 productos de Yupoo)
npm run dev        # http://localhost:3001

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

---

## API Endpoints

### Públicos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Listar camisetas con variantes |
| GET | `/api/products/:id` | Detalle de una camiseta |
| GET | `/api/shipping-options` | Opciones de envío disponibles |
| GET | `/api/payments/config` | Clave pública de Stripe |
| GET | `/api/health` | Health check |

### Auth opcional (funcionan logueado o como invitado)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/orders` | Crea borrador. Si no hay sesión, requiere `guestEmail` en el body — devuelve `guest_token` a reenviar en el header `X-Guest-Token` |
| GET | `/api/orders/:id` | Detalle de pedido (dueño = customer o guest_token) |
| POST | `/api/orders/:id/items` | Agrega ítem |
| DELETE | `/api/orders/:id/items/:itemId` | Elimina ítem |
| PUT | `/api/orders/:id/items/:itemId` | Actualiza cantidad |
| PUT | `/api/orders/:id/shipping` | Método de envío + dirección |
| POST | `/api/orders/:id/confirm` | Crea el PaymentIntent de Stripe |
| POST | `/api/webhook` | Webhook de Stripe (pago confirmado, descuenta stock) |

### Requieren cuenta (Auth0)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/orders` | Historial de pedidos del cliente |
| GET | `/api/customers/me` | Perfil del cliente |
| PUT | `/api/customers/me` | Actualizar perfil |

### Protegido por secreto compartido (header `X-Scrape-Secret`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/admin/scrape` | Dispara el scraper on-demand (async, responde 202 al toque) — lo llama el cron de GitHub Actions |

---

## Base de datos (SQLite / Turso)

```
customers        — auth0_id, email, name, phone
products         — name, description, club, category, version, type, price, image_urls (JSON array)
product_variants — product_id, size (XS–XXXL), stock
orders           — customer_id (nullable), guest_email/name/phone/token, status, shipping_*, totals, stripe_*
order_items      — order_id, variant_id, quantity, unit_price
```

**Estados de orden:** `draft` → `pending_payment` → `paid` → `shipped` | `cancelled`

**Invitado vs. cuenta:** un pedido tiene `customer_id` (si hay cuenta) **o** `guest_email` + `guest_token` (si es invitado) — nunca ambos vacíos.

---

## Tarjeta de prueba Stripe

```
Número:   4242 4242 4242 4242
Exp:      cualquier fecha futura (ej. 12/29)
CVC:      cualquier 3 dígitos
```

---

## Productos de stock incluidos (`npm run seed`)

| Club | Producto | Versión | Talles | Precio |
|------|----------|---------|--------|--------|
| River Plate | River 125th | Retro | M, XXL | €25 |
| River Plate | River Home Player Version | Titular | L, XL, XXL | €25 |
| Racing Club | Racing Home Player Version | Titular | L, XL, XXL | €25 |
| Racing Club | Racing Home Retro | Retro | XL | €25 |
| San Lorenzo | Slo Home | Titular | XL | €25 |
| San Lorenzo | Slo Away | Suplente | XXL | €25 |
| Selección Argentina | Short Home | — | M, L | €25 |
| Selección Argentina | Thrasher x Selección Argentina | Edición especial | XL, XXL | €25 |

Precio de 25€ parejo es provisorio — ver Requisitos.md para ajustarlo por producto. Fotos ya cargadas en `frontend/public/images/products/` (ver Requisitos.md §3.4), con carrusel por producto en `/shop`.

El catálogo **on-demand** (27 productos: Selección Argentina + River Plate + Boca Juniors, 20€ fijo) no se siembra a mano — se puebla corriendo `npm run scrape` (ver sección 4 de Configuración).
