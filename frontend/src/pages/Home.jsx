import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const features = [
  {
    icon: '⭐',
    title: 'Calidad Premium',
    desc: 'Camisetas de alta tecnología, idénticas a las del plantel profesional. Tres estrellas, una pasión.',
  },
  {
    icon: '🚚',
    title: 'Envío a toda Europa',
    desc: 'Envíos estándar y express disponibles. Elegí la opción que más te convenga.',
  },
  {
    icon: '🔒',
    title: 'Pago 100% Seguro',
    desc: 'Procesamos tus pagos con Stripe. Aceptamos todas las tarjetas de crédito y débito.',
  },
];

export default function Home() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div>
      {/* Hero */}
      <section className="hero-bg text-white py-28 px-6 text-center">
        <p className="text-arg-gold font-semibold tracking-[0.3em] text-sm uppercase mb-4">
          Colección Oficial 2024
        </p>
        <h1 className="font-display text-[clamp(3.5rem,12vw,9rem)] leading-none tracking-wide mb-6">
          LA CAMISETA<br />ARGENTINA
        </h1>
        <p className="text-lg text-blue-100 max-w-xl mx-auto mb-10">
          Vistí los colores del campeón del mundo. Talles S, M, L, XL —{' '}
          <span className="text-arg-gold font-bold">solo €20 cada una</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/shop" className="btn-gold text-lg px-10 py-4 rounded-xl inline-block">
            Comprar ahora →
          </Link>
          <button
            onClick={() => loginWithRedirect()}
            className="bg-white/15 hover:bg-white/25 backdrop-blur text-white font-semibold text-lg px-10 py-4 rounded-xl transition-all"
          >
            Crear cuenta
          </button>
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

      {/* Sizes banner */}
      <section className="bg-arg-blue-dk py-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-white text-center sm:text-left">
            <p className="font-display text-4xl tracking-widest mb-1">TODOS LOS TALLES</p>
            <p className="text-blue-200">S · M · L · XL disponibles en todos los modelos</p>
          </div>
          <div className="flex gap-3">
            {['S', 'M', 'L', 'XL'].map(s => (
              <div key={s} className="w-14 h-14 rounded-xl bg-white/20 text-white font-display text-2xl flex items-center justify-center">
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-arg-blue py-16 text-center text-white">
        <h2 className="font-display text-5xl mb-3 tracking-wide">¡DALE CAMPEÓN!</h2>
        <p className="text-blue-100 mb-8 text-lg">3 modelos exclusivos · Solo €20 · Envío a Europa</p>
        <Link to="/shop" className="btn-gold text-lg px-12 py-4 rounded-xl inline-block">
          Ver camisetas
        </Link>
      </section>

      <footer className="bg-gray-900 text-gray-500 text-center py-8 text-sm">
        <p>© 2024 La Camiseta Argentina &nbsp;·&nbsp; Hecho con ❤️ y pasión albiceleste</p>
      </footer>
    </div>
  );
}
