# Requisitos — Camisetas Argentinas (nombre a definir)

> Documento vivo. Se va completando a medida que tomamos decisiones. Las secciones marcadas **[ABIERTO]** son decisiones pendientes.

## 1. Contexto y objetivo

Luján y Felipe son socios. Importan camisetas de clubes argentinos y las venden en **España/Europa**. El objetivo de este proyecto es construir el sitio web de venta online, dejando de depender de canales manuales (WhatsApp, Instagram, etc.).

Volumen esperado: **bajo caudal de clientes**. Esto es una decisión de diseño transversal: priorizamos simplicidad y bajo costo de mantenimiento por sobre escalabilidad.

## 2. Alcance: dos modalidades de compra

### 2.1 Compra instantánea (stock propio)
- Productos que Luján/Felipe ya tienen físicamente en stock.
- Precio algo más alto que on-demand (ya está el costo de importación asumido).
- Entrega en **máximo 5 días**.
- Catálogo inicial de 8 productos (ver sección 3).

### 2.2 Compra on-demand (pedido a demanda) — ✅ implementado
- Productos que **no** están en stock; se encargan tras la compra.
- **Precio: 20€ fijo** para todos los productos on-demand.
- **Plazo de entrega: mensaje fijo de "Entrega estimada: 20 días"** en la ficha de producto, el carrito y el checkout.
- **Sitio scrapeado:** https://classic-football-fhirts052.x.yupoo.com/ — catálogo mayorista en Yupoo (proveedor chino). Alcance acotado a **Selección Argentina + River Plate + Boca Juniors (27 productos)**, no el resto del sitio (cientos de productos de otros países, fuera de la identidad de la marca).
  - ⚠️ **Riesgo legal marcado y aceptado por Luján:** el sitio usa nomenclatura típica de réplicas (grados de calidad tipo "8A", "5A", "3B"), lo que indica que son camisetas no oficiales/falsificadas. Revender esto en España implica riesgo real de infracción de marca (retención en aduana, multas, posible responsabilidad legal en venta a escala comercial). Luján decidió seguir adelante de todas formas — decisión de negocio, no técnica.
- **Modo de scraping:** catálogo cacheado (`backend/src/scraper/`). Upsert por `source_url` — nunca borra productos (los desactiva con `active=0` si desaparecen del sitio fuente), así que un re-scrapeo nunca rompe pedidos históricos. Imágenes hotlinkeadas directo del CDN de Yupoo (no se re-hostean, a diferencia de las fotos de stock).
- **Automatización:** GitHub Actions (`.github/workflows/scrape-catalog.yml`, cron diario 06:00 UTC) dispara `POST /api/admin/scrape` en el backend, protegido por secreto compartido. **Pendiente que Luján configure los secrets** `BACKEND_URL` y `SCRAPE_SECRET` en GitHub (Settings → Secrets → Actions) una vez que el backend esté desplegado en Render, y la misma `SCRAPE_SECRET` como variable de entorno en Render — ver README.
- Frontend: toggle "En stock" / "A pedido" en `/shop`; si el carrito mezcla ambos tipos, se muestra un aviso de que llegan por separado (resuelve la pregunta abierta de §4.2).

## 3. Catálogo inicial (stock instantáneo)

Fuente de fotos: [carpeta de Google Drive](https://drive.google.com/drive/folders/1s05mRy3a6Mi_sRVy7FWA1V7CHu4qneMm), ya organizada en 8 subcarpetas por producto (ver sección 3.2). Fuente de stock/talles: planilla de inventario de Luján (capturas compartidas en el chat).

**Nota sobre el modelo de stock:** la planilla trae columnas Compras/Ventas/Stock, pero la base de datos del sitio solo va a guardar el **Stock actual** por talle — el historial de compras/ventas lo siguen llevando aparte en la planilla, no es responsabilidad de la web.

### 3.1 Productos confirmados (con foto y stock)

| Producto (Tipo en planilla) | Club | Versión | Talles y stock | Precio |
|---|---|---|---|---|
| River 125th | River Plate | Retro (125° aniversario) | M: 1, XXL: 3 | 25€ (provisorio) |
| River Home Player Version | River Plate | Titular 2026 | L: 1, XL: 1, XXL: 1 | 25€ (provisorio) |
| Racing Home Player Version | Racing Club | Titular 2026 | L: 1, XL: 1, XXL: 1 | 25€ (provisorio) |
| Racing Home Retro | Racing Club | Retro | XL: 1 | 25€ (provisorio) |
| Slo Home | San Lorenzo | Titular | XL: 1 | 25€ (provisorio) |
| Slo Away | San Lorenzo | Suplente | XXL: 1 | 25€ (provisorio) |
| Short Home | Selección Argentina | Short adidas Climacool | M: 1, L: 1 | 25€ (provisorio) |
| Thrasher x Selección Argentina | Selección Argentina | Edición especial (colab. Thrasher Revista) | XL: 5, XXL: 4 | 25€ (provisorio) |

### 3.2 Pendientes de fotos/detalle (ya están en la planilla, faltan fotos o definir club/modelo)

| Producto (Tipo en planilla) | Categoría | Talles y stock | Estado |
|---|---|---|---|
| Entrenamiento | Ropa de entrenamiento (no es camiseta de partido) | XL: 2, XXL: 1 | **[ABIERTO]** — Luján va a pasar fotos |

> **Descartado del catálogo:** "PEDIDO DOLAPE" — es un pedido puntual a proveedor, no un producto de catálogo.

### 3.3 Discrepancia a revisar

Al organizar las fotos de Drive apareció un grupo — **River rayada** (carpeta `03-river-rayada`, 4 fotos) — que **no** figura como stock en la planilla. Puede ser una foto de un producto que falta cargar a la planilla, o fotos mal agrupadas. **[ABIERTO — a confirmar con Luján]**. (La otra discrepancia que había, "Racing suplente", ya se resolvió — ver 3.4: es "Racing away retro".)

### 3.4 Fotos organizadas en Drive → productos (confirmado por Luján)

| Carpeta | Fotos | Producto | Estado |
|---|---|---|---|
| 01-river-retro | 7 | River 125th | ✅ cargadas en el sitio |
| 02-river-titular-26 | 4 | River Home Player Version | ✅ cargadas en el sitio |
| 03-river-rayada | 4 | **sin match en planilla** (ver 3.3) | pendiente |
| 04-sanlorenzo-titular-26 | 6 | Slo Home | ✅ cargadas en el sitio |
| 05-sanlorenzo-suplente-26 | 5 | Slo Away | ✅ cargadas en el sitio |
| 06-racing-titular-26 | 3 | Racing Home Player Version | ✅ cargadas en el sitio |
| 07-racing-suplente-26 | 4 | **Racing Away Player Version** (producto nuevo, confirmado por Luján) | fotos listas, **sin stock actualmente** — no se suma al catálogo hasta que haya unidades |
| 08-racing-rayada | 5 | Racing Home Retro | ✅ cargadas en el sitio |
| 06-shorts-Argentina | 5 | Short Home | ✅ cargadas en el sitio |
| 10-trusthes | 4 (2 duplicadas, 3 fotos únicas) | Thrasher x Selección Argentina | ✅ cargadas en el sitio |

"TRASHER" resultó ser una camiseta de la Selección Argentina, edición especial en colaboración con **Thrasher Revista** (adidas/AFA oficial) — no es un club ni un modelo a definir, se renombró a "Thrasher x Selección Argentina" para que quede claro en el catálogo. "Short Home" es un short oficial adidas Climacool de la Selección (no de un club).

Las fotos se guardaron localmente en `frontend/public/images/products/<slug>/` (no como links a Drive, para no depender de que Google mantenga el link vivo) y cada producto las muestra en un carrusel dentro de su card en `/shop`.

Nota: dentro de "02-river-titular-26" el agente detectó 3 variantes visualmente distintas (sponsor "Betano" simple, versión jacquard, y versión "DIRECTV"/125 años) agrupadas como un solo producto — a confirmar si son la misma "River Home Player Version" o productos separados.

## 4. Requisitos funcionales

### 4.1 Catálogo — ✅ implementado
- Listado de productos con filtro por club y por modalidad (stock / on-demand) — toggle en `/shop`.
- Ficha de producto: fotos (carrusel), club, versión, talles, precio, plazo de entrega.

### 4.2 Carrito — ✅ implementado
- Agregar/quitar productos y talles.
- El carrito **sí puede mezclar** ítems de stock y on-demand — se permite, y se muestra un aviso de que llegan por separado con tiempos distintos (no se bloquea ni se separa en pedidos distintos).

### 4.3 Checkout
- **Ambas modalidades:** compra como invitado (nombre, email, dirección) **o** con cuenta (login).
- Login con **Auth0** (se mantiene el que ya está armado), ahora opcional en vez de obligatorio.
- Con cuenta: historial de pedidos guardado.

### 4.4 Pago
- **Stripe** (ya integrado en el código base). Tarjetas + Bizum para clientes en España.
- Checkout embebido (Stripe Payment Element), igual que en la base actual.

### 4.5 Pedidos
- Estados: `draft` → `pending_payment` → `paid` → `shipped` | `cancelled` (ya existe en el modelo actual, se reutiliza).
- Para pedidos on-demand, agregar estado intermedio `ordered_to_supplier` **[ABIERTO — confirmar nombre/flujo]**.

## 5. Requisitos no funcionales
- Bajo volumen de tráfico: no se optimiza para escala, se prioriza costo y simplicidad de mantenimiento.
- Sitio en español (idioma único para v1).
- Responsive (mobile-first, la mayoría de las compras por redes suelen venir de mobile).

## 6. Arquitectura técnica (decisiones tomadas)

> Revisado: la primera versión de esta sección proponía Supabase (Postgres + Auth). Se simplificó porque implicaba demasiada reescritura/mantenimiento para el tamaño del proyecto — ver [plan técnico](../../../../.claude/plans/swirling-splashing-bachman.md) para el detalle de la decisión.

| Capa | Tecnología | Notas |
|------|------------|-------|
| Frontend | React + Vite + Tailwind, desplegado en **Vercel** (plan gratis) | Se reutiliza el frontend existente, adaptado al nuevo catálogo/flujo |
| Backend | Node.js + Express, desplegado en **Render** (plan gratis) | Se reutiliza el backend existente (rutas/controladores). Sin disco persistente, pero ya no lo necesita |
| Base de datos | **Turso** (SQLite alojado en la nube, plan gratis) | Reemplaza el archivo SQLite local. Mismo esquema/SQL de siempre — solo se convierten las llamadas de sync a async (`better-sqlite3` → `@libsql/client`) |
| Auth | **Auth0** (se mantiene, sin cambios) | Pasa a ser **opcional**: el checkout funciona con cuenta o como invitado |
| Pagos | **Stripe** | Ya integrado en la base actual |
| Scraping on-demand | Proceso cron (a definir dónde corre) **[ABIERTO]** | Fase futura, no incluida en esta migración |

Costo mensual total de esta arquitectura: **0**.

## 7. Modelo de datos (ajustes sobre el esquema actual)

Esquema actual (`customers`, `products`, `product_variants`, `orders`, `order_items`) se mantiene como base, con cambios:

- `products`: agregar columnas `club` (nullable — no todos los productos son de un club, ej. shorts/entrenamiento genérico), `category` (`camiseta` | `short` | `entrenamiento`), `version` (titular/suplente/retro), `type` (`stock` | `on_demand`), `source_url` (para productos on-demand, referencia al sitio scrapeado).
- Nueva tabla `scraped_catalog` (o similar): cache del scraping, con `last_synced_at`, para separar "lo que vimos en el sitio externo" de "lo que ofrecemos nosotros" — permite curar/filtrar antes de publicar.
- `orders`: `customer_id` pasa a nullable, se agregan `guest_email`, `guest_name`, `guest_phone`, `guest_token` (para identificar el pedido de un invitado sin cuenta).

## 8. Pendiente / próximos pasos

1. Sitio a scrapear + scraper on-demand — ✅ hecho (ver 2.2), probado end-to-end (27 productos, upsert seguro verificado con un pedido real que sobrevivió a un re-scrapeo).
2. **[ABIERTO]** Resolver discrepancia River rayada (fotos sin match en planilla, ver 3.3).
3. **[ABIERTO]** Fotos y detalle de club/modelo para "Entrenamiento" (Luján las va a pasar). TRASHER y Short Home ya resueltos — ✅ hecho.
3b. "Racing Away Player Version" — sin stock actual, no se suma al catálogo por ahora (fotos ya listas — ver 3.4). Retomar cuando haya unidades.
4. Organizar las fotos de Google Drive por producto (carpeta por club+versión) — ✅ hecho.
5. Definir costos y zonas de envío (¿solo España? ¿Europa?) **[ABIERTO]**.
6. Definir si van a facturar como empresa (IVA, factura a clientes) o venta informal **[ABIERTO]** — afecta checkout y contabilidad.
7. Política de cambios/devoluciones **[ABIERTO]**.
8. Migrar backend: `better-sqlite3` → `@libsql/client` (Turso) — ✅ hecho y probado en local (falta crear la cuenta de Turso real para producción, ver README).
9. Hacer Auth0 opcional (checkout invitado + con cuenta) — ✅ hecho, probado end-to-end como invitado.
10. Adaptar frontend: nuevo catálogo con club/versión/categoría, talles dinámicos por producto, filtro por club — ✅ hecho.
11. Cargar imágenes reales de los productos — ✅ hecho: fotos guardadas en `frontend/public/images/products/`, con carrusel por producto en `/shop` (ver 3.4).
12. **[ABIERTO]** Cargar claves reales de Stripe en `backend/.env` para poder probar un pago de punta a punta (hoy están con valores de ejemplo).
13. Toggle stock vs on-demand en el frontend — ✅ hecho.
14. **[ABIERTO]** Configurar los secrets `BACKEND_URL` y `SCRAPE_SECRET` en GitHub Actions (una vez que el backend esté desplegado en Render) y `SCRAPE_SECRET` en las variables de entorno de Render, para que el cron diario de scraping funcione en producción — ver README.
15. **Mejora futura (no ahora):** panel de admin para cargar productos/fotos nuevos sin depender de pedirle a Claude que lo haga a mano. Requiere reemplazar el storage de imágenes actual (archivos commiteados en `frontend/public/`) por uno real (ej. Cloudflare R2 o Supabase Storage, ambos con plan gratis) para poder subir fotos en caliente sin necesitar un `git push`. Vale la pena el día que cargar productos nuevos se vuelva frecuente.
