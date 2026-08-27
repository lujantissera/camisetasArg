// Catálogo on-demand: solo Selección Argentina + River Plate + Boca Juniors (27 productos),
// no el resto del sitio (cientos de productos de otros países, fuera de la identidad de la marca).
const CATEGORIES = [
  { url: 'https://classic-football-fhirts052.x.yupoo.com/categories/189008?isSubCate=true', label: 'Selección Argentina' },
  { url: 'https://classic-football-fhirts052.x.yupoo.com/categories/4124524', label: 'Liga Argentina' },
];

const TEAM_MAP = {
  '阿根廷': 'Selección Argentina',
  '河床': 'River Plate',
  '博卡': 'Boca Juniors',
};

const POSITION_MAP = {
  '主场': 'Titular',
  '客场': 'Suplente',
  '二客': 'Alternativa',
};

// Modificadores que pueden aparecer ANTES de la temporada, separados por "："/":" (ej. "长袖：1986赛季...").
const PREFIX_MODIFIER_MAP = {
  '长袖': 'Manga Larga',
};

const MODIFIER_MAP = {
  '复古': 'Retro',
};

const EDITION_MAP = {
  '马拉多纳纪念版': 'Edición Maradona',
  '纪念版': 'Edición Conmemorativa',
};

const COLOR_MAP = {
  '白色': 'Blanco',
  '彩蓝': 'Celeste',
};

// Sufijo de "grado de calidad" (jerga del mercado de réplicas, ej. "8A", "5 A", "0B") — se
// elimina siempre del nombre visible al cliente. Tolera espacio opcional entre número y letra.
const GRADE_SUFFIX_RE = /\s*[0-9]\s*[A-Za-z]\s*$/;

// Temporada al inicio del texto restante, ej. "2001赛季" o "1999/00赛季".
const SEASON_PREFIX_RE = /^(\d{4}(?:\/\d{2})?)(赛季)?/;

const ONDEMAND_PRICE = 20.0;
const ONDEMAND_DELIVERY_NOTE = 'Entrega estimada: 20 días (producto a pedido)';
// "Siempre disponible" — es a pedido, no stock real. 999 en vez de NULL/Infinity porque la
// columna es INTEGER NOT NULL. Los re-scrapeos periódicos lo topean de nuevo a 999.
const ONDEMAND_STOCK = 999;
const ONDEMAND_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

// Umbral mínimo de productos scrapeados antes de permitir desactivar los que ya no aparecen —
// evita vaciar el catálogo por un cambio de HTML del sitio fuente o un fetch parcial.
const MIN_EXPECTED_PRODUCTS = 20;

// Delay entre fetches de álbumes individuales — no golpear el sitio fuente.
const FETCH_DELAY_MS = 400;

module.exports = {
  CATEGORIES,
  TEAM_MAP,
  POSITION_MAP,
  PREFIX_MODIFIER_MAP,
  MODIFIER_MAP,
  EDITION_MAP,
  COLOR_MAP,
  GRADE_SUFFIX_RE,
  SEASON_PREFIX_RE,
  ONDEMAND_PRICE,
  ONDEMAND_DELIVERY_NOTE,
  ONDEMAND_STOCK,
  ONDEMAND_SIZES,
  MIN_EXPECTED_PRODUCTS,
  FETCH_DELAY_MS,
};
