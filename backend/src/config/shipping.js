// Fuente única de verdad para las opciones de envío — el backend valida/calcula contra esto,
// y el frontend lo consume vía GET /api/shipping-options en vez de duplicarlo.
const SHIPPING_OPTIONS = [
  { id: 'free', label: 'Envío gratuito', desc: '10–15 días hábiles', price: 0, icon: '📦' },
  { id: 'standard', label: 'Envío estándar', desc: '5–7 días hábiles', price: 5, icon: '🚚' },
  { id: 'express', label: 'Envío express', desc: '2–3 días hábiles', price: 12, icon: '⚡' },
];

const SHIPPING_COSTS = Object.fromEntries(SHIPPING_OPTIONS.map(o => [o.id, o.price]));

module.exports = { SHIPPING_OPTIONS, SHIPPING_COSTS };
