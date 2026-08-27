import { Link } from 'react-router-dom';

const CLUBS = [
  { name: 'River Plate', abbr: 'CARP', color: '#c8102e', text: '#fff' },
  { name: 'Racing Club', abbr: 'RCC', color: '#74ACDF', text: '#0a1526' },
  { name: 'San Lorenzo', abbr: 'CASLA', color: '#0033a0', text: '#fff' },
  { name: 'Boca Juniors', abbr: 'CABJ', color: '#0d1b4c', text: '#F6B40E' },
  { name: 'Selección AFA', abbr: 'AFA', color: '#74ACDF', text: '#0a1526' },
];

const FEATURES = [
  {
    icon: '🏆',
    title: 'Historia y presente',
    desc: 'Titulares, suplentes y ediciones retro — de las camisetas que se juegan hoy a las que marcaron una época.',
  },
  {
    icon: '📦',
    title: 'Stock o a pedido',
    desc: 'Lo que tenemos en stock llega en hasta 5 días. Lo que no, se encarga y llega en ~20 días.',
  },
  {
    icon: '🔒',
    title: 'Pago 100% seguro',
    desc: 'Procesamos los pagos con Stripe. Aceptamos todas las tarjetas de crédito y débito.',
  },
  {
    icon: '🚚',
    title: 'Envío a España',
    desc: 'Envío gratuito, estándar o express — elegís la opción que más te convenga en el carrito.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-bg text-white pt-24 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pitch-texture pointer-events-none" />
        <div className="relative">
          <p className="text-arg-gold font-semibold tracking-[0.3em] text-sm uppercase mb-4">
            River · Racing · San Lorenzo · Boca · Selección
          </p>
          <h1 className="font-display text-[clamp(3rem,10vw,7.5rem)] leading-[0.95] tracking-wide mb-6">
            CAMISETAS DE FÚTBOL<br />
            <span className="text-arg-gold">DE HOY, DE AYER</span><br />
            Y DE SIEMPRE
          </h1>
          <p className="text-lg text-blue-100/90 max-w-xl mx-auto mb-10">
            Con stock disponible para entrega inmediata.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/shop" className="btn-gold text-base px-10 py-4 rounded-xl inline-block">
              Ver colección →
            </Link>
          </div>

          {/* Club badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {CLUBS.map(c => (
              <div
                key={c.name}
                className="flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-display tracking-wider shrink-0"
                  style={{ backgroundColor: c.color, color: c.text }}
                >
                  {c.abbr}
                </span>
                <span className="text-xs font-medium text-blue-100">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-arg-blue-d font-semibold tracking-[0.25em] text-xs uppercase text-center mb-2">
            Por qué elegirnos
          </p>
          <h2 className="font-display text-4xl text-center text-arg-blue-dk mb-14 tracking-wider">
            HECHO PARA EL HINCHA
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-7 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-arg-blue-dk/5 flex items-center justify-center text-2xl">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-bg py-16 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 pitch-texture pointer-events-none" />
        <div className="relative">
          <h2 className="font-display text-5xl mb-3 tracking-wide">¡DALE CAMPEÓN!</h2>
          <p className="text-blue-100/90 mb-8 text-lg">
            Camisetas en stock con entrega en hasta 5 días · Envío a España
          </p>
          <Link to="/shop" className="btn-gold text-lg px-12 py-4 rounded-xl inline-block">
            Ver camisetas
          </Link>
        </div>
      </section>

      <footer className="bg-pitch-950 text-blue-100/60 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">⚽</span>
            <span className="font-display text-xl tracking-widest text-white">CAMISETAS ARG</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
            <Link to="/shop" className="hover:text-white transition-colors">Tienda</Link>
          </div>
          <p className="text-xs text-blue-100/40">© 2026 Camisetas Argentinas · Pagos seguros con Stripe</p>
        </div>
      </footer>
    </div>
  );
}
