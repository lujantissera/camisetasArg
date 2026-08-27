import { Link } from 'react-router-dom';

const features = [
  {
    icon: '⭐',
    title: 'Clubes argentinos',
    desc: 'River Plate, San Lorenzo, Racing Club y más — importadas directamente de Argentina.',
  },
  {
    icon: '🚚',
    title: 'Envío a España',
    desc: 'Envíos estándar y express disponibles. Elegí la opción que más te convenga.',
  },
  {
    icon: '🔒',
    title: 'Pago 100% Seguro',
    desc: 'Procesamos tus pagos con Stripe. Aceptamos todas las tarjetas de crédito y débito.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-bg text-white py-28 px-6 text-center">
        <p className="text-arg-gold font-semibold tracking-[0.3em] text-sm uppercase mb-4">
          Camisetas de clubes argentinos
        </p>
        <h1 className="font-display text-[clamp(3.5rem,12vw,9rem)] leading-none tracking-wide mb-6">
          TU CLUB<br />DE SIEMPRE
        </h1>
        <p className="text-lg text-blue-100 max-w-xl mx-auto mb-10">
          River Plate, San Lorenzo, Racing Club — camisetas oficiales importadas, con stock
          disponible para entrega inmediata.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/shop" className="btn-gold text-lg px-10 py-4 rounded-xl inline-block">
            Comprar ahora →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-4xl text-center text-arg-blue-dk mb-14 tracking-wider">
            ¿POR QUÉ ELEGIRNOS?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(f => (
              <div key={f.title} className="card p-8 text-center">
                <div className="text-5xl mb-5">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-arg-blue py-16 text-center text-white">
        <h2 className="font-display text-5xl mb-3 tracking-wide">¡DALE CAMPEÓN!</h2>
        <p className="text-blue-100 mb-8 text-lg">Camisetas de stock con entrega en hasta 5 días · Envío a España</p>
        <Link to="/shop" className="btn-gold text-lg px-12 py-4 rounded-xl inline-block">
          Ver camisetas
        </Link>
      </section>

      <footer className="bg-gray-900 text-gray-500 text-center py-8 text-sm">
        <p>© 2026 Camisetas Argentinas &nbsp;·&nbsp; Hecho con ❤️ y pasión albiceleste</p>
      </footer>
    </div>
  );
}
