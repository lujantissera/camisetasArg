# Despliegue — Camisetas Argentinas

> Referencia rápida de dónde vive cada cosa y cómo se actualiza. Todo gratis, todo con auto-deploy desde `main`.

## URLs en producción

| Servicio | URL |
|---|---|
| Sitio (frontend) | https://camisetas-arg.vercel.app |
| API (backend) | https://camisetas-arg-backend.onrender.com |
| Repo | https://github.com/lujantissera/camisetasArg |

## Dónde vive cada parte

| Capa | Servicio | Plan | Notas |
|---|---|---|---|
| Frontend (React/Vite) | **Vercel** | Free (Hobby) | Root directory: `frontend`. Auto-deploy en cada push a `main`. |
| Backend (Express) | **Render** | Free | Root directory: `backend`. Build: `npm install`, Start: `npm start`. Auto-deploy en cada push a `main`. Se "duerme" tras inactividad — el primer pedido después de dormido tarda ~30-50s en responder. |
| Base de datos | **Turso** (SQLite en la nube) | Free | Un solo proyecto/base, la usan tanto el backend de Render como cuando corrés `npm run seed`/`npm run scrape` en local (según lo que tengas en `backend/.env`). |
| Fotos de stock | Commiteadas en `frontend/public/images/products/` | — | Se sirven directo desde Vercel, no necesitan nada aparte. |
| Fotos on-demand | Proxeadas desde Yupoo | — | Ver "Proxy de imágenes" más abajo. |
| Pagos | **Stripe** | — | Claves en `backend/.env` / variables de entorno de Render. |
| Login | **Auth0** | — | **⚠️ Pendiente — ver sección "Pendientes".** |

## Cómo se actualiza (CI/CD)

No hay pipeline propio armado — **Vercel y Render ya incluyen auto-deploy**: apenas se hace `git push` a `main`, ambos detectan el cambio y despliegan solos (Vercel en ~1-2 min, Render un poco más). No hace falta hacer nada manual salvo, ocasionalmente, entrar a revisar que el deploy terminó bien.

El catálogo **on-demand** (scraping de Yupoo) es aparte — no se actualiza con cada push, se actualiza corriendo el scraper (ver más abajo).

## Variables de entorno por servicio

**Render** (Environment → las carga cada uno a mano, no se pushean):
```
LIBSQL_URL, LIBSQL_AUTH_TOKEN       — de Turso
AUTH0_DOMAIN, AUTH0_AUDIENCE        — de Auth0 (pendiente, ver abajo)
STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
SCRAPE_SECRET                       — protege POST /api/admin/scrape
FRONTEND_URL                        — https://camisetas-arg.vercel.app (para CORS)
```

**Vercel** (Settings → Environment Variables — ⚠️ tienen que ser tipo **"Config"**, no "Secret", porque Vite necesita leerlas al momento del build; si quedan como "Secret" el sitio no las ve y no se pueden convertir después, hay que borrar y crear de nuevo):
```
VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, VITE_AUTH0_AUDIENCE   — de Auth0 (pendiente)
VITE_API_URL   — https://camisetas-arg-backend.onrender.com
```

**Local** (`backend/.env` y `frontend/.env`, nunca se pushean — están en `.gitignore`): mismos valores que arriba, más el archivo local de SQLite si `LIBSQL_URL` está vacío.

## Cómo actualizar el catálogo

- **Stock** (8 productos fijos): `cd backend && npm run seed` — apunta a la base que tengas configurada en `backend/.env` (local o Turso).
- **On-demand** (27 productos scrapeados de Yupoo): `cd backend && npm run scrape` — mismo criterio de a qué base apunta.
- En producción, esto también se puede disparar sin entrar a la terminal: `POST https://camisetas-arg-backend.onrender.com/api/admin/scrape` con el header `X-Scrape-Secret: <el mismo valor que SCRAPE_SECRET>`.

## Fotos de stock nuevas

Las fotos que suban de acá en adelante a `frontend/public/images/products/<producto>/` **hay que optimizarlas antes de commitear** — las de celular sin tocar pesan varios MB cada una y hacen que `/shop` cargue lento. Después de agregar fotos nuevas, correr:
```
cd frontend && node scripts/optimize-images.cjs
```
Redimensiona a 900px de ancho y comprime — no se nota la diferencia visual en las cards, pero pasan de ~1-3.5MB a ~100-250KB cada una. Es seguro correrlo de nuevo aunque ya haya fotos optimizadas (no las rompe, solo no gana casi nada la segunda vez).

## Proxy de imágenes (on-demand)

Yupoo bloquea el hotlink directo de sus fotos (si el pedido no "viene" de su propio sitio, devuelve error). Por eso las fotos on-demand no se muestran directo desde `photo.yupoo.com` — el frontend las reescribe para pasar por `GET /api/image-proxy?url=...` en nuestro backend, que le pide la foto a Yupoo con el header correcto y se la reenvía al navegador. Ver `backend/src/controllers/imageProxy.controller.js` y `frontend/src/lib/images.js`.

## Pendientes

1. **Auth0 no está configurado** (siguen los valores de ejemplo en `.env`) — el botón "Ingresar" no funciona todavía. El resto del sitio (navegar, comprar como invitado) funciona bien. Cuando se quiera activar login: crear la app en auth0.com, cargar los valores reales en `backend/.env`/`frontend/.env`, y **repetir el mismo proceso de "borrar y recrear como Config"** en Vercel para las 3 variables `VITE_AUTH0_*`, más actualizar `AUTH0_DOMAIN`/`AUTH0_AUDIENCE` en Render.
2. **Cron del scraping no está automatizado todavía** — `.github/workflows/scrape-catalog.yml` ya existe pero necesita los secrets `BACKEND_URL` y `SCRAPE_SECRET` cargados en GitHub (Settings → Secrets and variables → Actions) para poder correr solo todos los días. Mientras tanto, correr `npm run scrape` a mano cuando se quiera refrescar el catálogo on-demand.
3. Ver [Requisitos.md](./Requisitos.md) para el resto de las decisiones de negocio pendientes (envíos, facturación, productos sin fotos, etc.).

## Cosas raras que nos encontramos (por si vuelven a pasar)

- **Vercel: variables `VITE_*` como "Secret" no se aplican al build.** Tienen que ser "Config". Si ya la creaste como "Secret", no se puede convertir — hay que borrarla y crearla de nuevo.
- **Vercel: rutas internas (`/shop`, `/cart`, etc.) dan 404 al entrar directo o recargar** si falta `frontend/vercel.json` con un rewrite a `index.html` (ya está resuelto, solo por si se borra sin querer).
- **Vercel: al importar el proyecto puede ofrecer desplegar `backend` también** (como si fuera otro servicio dentro del mismo proyecto). Hay que sacarlo de la selección — el backend vive solo en Render.
