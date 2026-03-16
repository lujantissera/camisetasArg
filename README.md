# La Camiseta Argentina ⭐⭐⭐

E-commerce de camisetas de la Selección Argentina. Stack completo con React, Node.js, Auth0 y Stripe.

---

## Stack tecnológico

| Capa          | Tecnología                                        |
|---------------|---------------------------------------------------|
| Frontend      | React 18 + Vite + TailwindCSS                     |
| Autenticación | Auth0 (OAuth 2.0 / OIDC)                         |
| Backend       | Node.js + Express                                 |
| Base de datos | SQLite (`better-sqlite3`)                         |
| Pagos         | Stripe (Payment Element)                          |
| Envío         | Gratis / Estándar €5 / Express €12                |

---

## Estructura del proyecto

```
camisetas-arg/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js   # esquema SQLite + init
│   │   │   └── seed.js       # datos de prueba
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT via Auth0 + auto-create customer
│   │   ├── routes/
│   │   │   ├── products.js   # GET /api/products
│   │   │   ├── orders.js     # CRUD órdenes + confirm
│   │   │   ├── customers.js  # perfil del cliente
│   │   │   └── payments.js   # Stripe publishable key
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/CartContext.jsx
│   │   ├── components/Navbar.jsx
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Shop.jsx
│   │       ├── Cart.jsx
│   │       ├── Checkout.jsx  # 2 pasos: dirección + Stripe
│   │       └── Orders.jsx
│   ├── .env.example
│   └── package.json
└── data/
    └── shop.db               # creado automáticamente
```

---

## Configuración paso a paso

### 1. Auth0

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

### 2. Stripe

1. Creá una cuenta en [stripe.com](https://stripe.com)
2. En modo **Test**, copiá `Publishable key` y `Secret key`
3. Para el webhook local instalá [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe login
stripe listen --forward-to http://localhost:3001/api/webhook
# Copiá el "webhook signing secret" que aparece (whsec_...)
```

### 3. Variables de entorno

**Backend** — copiar `.env.example` a `.env` y completar:
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
AUTH0_DOMAIN=tu-tenant.auth0.com
AUTH0_AUDIENCE=https://camisetas-arg-api
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
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
npm run seed       # poblar DB con 3 camisetas (S/M/L/XL, 50 unidades c/u)
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
| GET | `/api/health` | Health check |

### Protegidos (requieren JWT de Auth0)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/orders` | **createSalesOrder** — crea borrador |
| GET | `/api/orders` | Listar pedidos del cliente |
| GET | `/api/orders/:id` | Detalle de pedido |
| POST | `/api/orders/:id/items` | **addItem** — agrega ítem |
| DELETE | `/api/orders/:id/items/:itemId` | **removeItem** |
| PUT | `/api/orders/:id/items/:itemId` | Actualiza cantidad |
| PUT | `/api/orders/:id/shipping` | Método de envío + dirección |
| POST | `/api/orders/:id/confirm` | **confirmSalesOrder** → crea PaymentIntent |
| GET | `/api/customers/me` | Perfil del cliente |
| PUT | `/api/customers/me` | Actualizar perfil |
| GET | `/api/payments/config` | Clave pública de Stripe |
| POST | `/api/webhook` | Webhook de Stripe (pago confirmado) |

---

## Base de datos (SQLite)

```
customers        — auth0_id, email, name, phone
products         — name, description, image_url, price
product_variants — product_id, size (S/M/L/XL), stock
orders           — customer_id, status, shipping_*, totals, stripe_*
order_items      — order_id, variant_id, quantity, unit_price
```

**Estados de orden:** `draft` → `pending_payment` → `paid` → `shipped` | `cancelled`

---

## Tarjeta de prueba Stripe

```
Número:   4242 4242 4242 4242
Exp:      cualquier fecha futura (ej. 12/29)
CVC:      cualquier 3 dígitos
```

---

## Productos incluidos (seed)

| Modelo | Talles | Precio | Stock |
|--------|--------|--------|-------|
| Camiseta Argentina Local 2024 | S M L XL | €20 | 50 c/u |
| Camiseta Argentina Visitante 2024 | S M L XL | €20 | 50 c/u |
| Camiseta Copa América Campeón | S M L XL | €20 | 50 c/u |
