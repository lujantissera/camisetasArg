import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { proxyImageUrl } from '../lib/images';

const FALLBACK_IMG = 'https://placehold.co/400x320/74ACDF/FFFFFF?text=Camiseta';

function ProductCarousel({ images, alt }) {
  const [index, setIndex] = useState(0);
  const photos = images && images.length > 0 ? images.map(proxyImageUrl) : [FALLBACK_IMG];

  function prev(e) {
    e.stopPropagation();
    setIndex(i => (i - 1 + photos.length) % photos.length);
  }
  function next(e) {
    e.stopPropagation();
    setIndex(i => (i + 1) % photos.length);
  }

  return (
    <div className="relative overflow-hidden group">
      <img
        src={photos[index]}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="w-full h-60 object-cover"
        onError={e => { e.target.src = FALLBACK_IMG; }}
      />

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Foto anterior"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
          >‹</button>
          <button
            onClick={next}
            aria-label="Foto siguiente"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
          >›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(null);

  const sizes = product.variants || [];

  function handleAdd() {
    if (!selectedSize) { toast.error('Seleccioná un talle primero'); return; }
    const variant = sizes.find(v => v.size === selectedSize);
    if (!variant || variant.stock === 0) { toast.error('Sin stock en ese talle'); return; }
    addToCart(product, variant, 1);
    toast.success(`✅ ${product.name} (${selectedSize}) agregado`);
  }

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="relative">
        <ProductCarousel images={product.image_urls} alt={product.name} />
        <div className="absolute top-3 right-3 bg-arg-gold text-pitch-950 font-bold px-3 py-1 rounded-full text-sm shadow pointer-events-none">
          €{product.price.toFixed(2)}
        </div>
        {product.club && (
          <div className="absolute top-3 left-3 bg-pitch-950/85 text-white font-semibold px-3 py-1 rounded-full text-xs shadow pointer-events-none backdrop-blur-sm">
            {product.club}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 mb-1 text-base leading-snug">{product.name}</h3>
        <p className="text-sm text-gray-400 mb-2 flex-1 line-clamp-2">{product.description}</p>

        <p className={`text-xs font-medium mb-4 ${product.type === 'on_demand' ? 'text-amber-600' : 'text-green-600'}`}>
          {product.type === 'on_demand' ? '🕒 Entrega estimada: 20 días (a pedido)' : '📦 Entrega en hasta 5 días (en stock)'}
        </p>

        {/* Size selector — tallas dinámicas, cada producto puede tener un set distinto */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Talle {selectedSize && <span className="text-arg-blue">— {selectedSize} seleccionado</span>}
          </p>
          <div className="flex gap-2 flex-wrap">
            {sizes.map(v => {
              const inStock = v.stock > 0;
              return (
                <button
                  key={v.size}
                  disabled={!inStock}
                  onClick={() => setSelectedSize(v.size)}
                  title={inStock ? `Stock: ${v.stock}` : 'Sin stock'}
                  className={`w-12 h-10 rounded-lg text-sm font-semibold border-2 transition-all ${
                    selectedSize === v.size
                      ? 'border-arg-blue bg-arg-blue text-white shadow-md'
                      : inStock
                      ? 'border-gray-300 text-gray-600 hover:border-arg-blue hover:text-arg-blue'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                  }`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={handleAdd} className="btn-primary w-full">
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('stock'); // 'stock' | 'on_demand'
  const [clubFilter, setClubFilter] = useState('all');

  useEffect(() => {
    axios.get('/api/products')
      .then(r => setProducts(r.data))
      .catch(() => toast.error('Error al cargar los productos'))
      .finally(() => setLoading(false));
  }, []);

  const byType = useMemo(() => products.filter(p => p.type === typeFilter), [products, typeFilter]);

  const clubs = useMemo(
    () => [...new Set(byType.map(p => p.club).filter(Boolean))],
    [byType]
  );

  const filtered = clubFilter === 'all' ? byType : byType.filter(p => p.club === clubFilter);

  return (
    <div>
      {/* Banner de sección */}
      <section className="hero-bg text-white pt-14 pb-10 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pitch-texture pointer-events-none" />
        <div className="relative">
          <h1 className="font-display text-5xl tracking-wider mb-2">
            NUESTRA COLECCIÓN
          </h1>
          <p className="text-blue-100/80 mb-8">
            {typeFilter === 'stock'
              ? 'Camisetas de fútbol con stock disponible para entrega inmediata'
              : 'Camisetas a pedido — se encargan tras la compra, entrega estimada 20 días'}
          </p>

          <div className="inline-flex rounded-xl border-2 border-white/15 bg-white/5 p-1">
            {[
              { id: 'stock', label: '📦 En stock' },
              { id: 'on_demand', label: '🕒 A pedido' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => { setTypeFilter(opt.id); setClubFilter('all'); }}
                className={`px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors ${
                  typeFilter === opt.id ? 'bg-arg-gold text-pitch-950' : 'text-blue-100/70 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {clubs.length > 1 && (
          <div className="flex justify-center gap-2 flex-wrap mb-10">
            <button
              onClick={() => setClubFilter('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                clubFilter === 'all' ? 'border-arg-blue-dk bg-arg-blue-dk text-white' : 'border-gray-200 text-gray-500 hover:border-arg-blue-dk'
              }`}
            >
              Todos
            </button>
            {clubs.map(club => (
              <button
                key={club}
                onClick={() => setClubFilter(club)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                  clubFilter === club ? 'border-arg-blue-dk bg-arg-blue-dk text-white' : 'border-gray-200 text-gray-500 hover:border-arg-blue-dk'
                }`}
              >
                {club}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-40">
            <div className="w-12 h-12 rounded-full border-4 border-arg-blue-dk border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">
            Sin productos disponibles. Ejecutá <code>npm run seed</code> en el backend.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
