import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

const FALLBACK_IMG = 'https://placehold.co/400x320/74ACDF/FFFFFF?text=Camiseta';

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
      <div className="relative overflow-hidden">
        <img
          src={product.image_url || FALLBACK_IMG}
          alt={product.name}
          className="w-full h-60 object-cover transition-transform duration-500 hover:scale-105"
          onError={e => { e.target.src = FALLBACK_IMG; }}
        />
        <div className="absolute top-3 right-3 bg-arg-gold text-white font-bold px-3 py-1 rounded-full text-sm shadow">
          €{product.price.toFixed(2)}
        </div>
        {product.club && (
          <div className="absolute top-3 left-3 bg-white/90 text-arg-blue-dk font-semibold px-3 py-1 rounded-full text-xs shadow">
            {product.club}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 mb-1 text-base leading-snug">{product.name}</h3>
        <p className="text-sm text-gray-400 mb-4 flex-1 line-clamp-2">{product.description}</p>

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

        <button onClick={handleAdd} className="btn-primary w-full text-sm">
          🛒 Agregar al carrito
        </button>
      </div>
    </div>
  );
}

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clubFilter, setClubFilter] = useState('all');

  useEffect(() => {
    axios.get('/api/products')
      .then(r => setProducts(r.data))
      .catch(() => toast.error('Error al cargar los productos'))
      .finally(() => setLoading(false));
  }, []);

  const clubs = useMemo(
    () => [...new Set(products.map(p => p.club).filter(Boolean))],
    [products]
  );

  const filtered = clubFilter === 'all' ? products : products.filter(p => p.club === clubFilter);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 rounded-full border-4 border-arg-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="font-display text-5xl text-arg-blue-dk tracking-wider mb-2">
          NUESTRA COLECCIÓN
        </h1>
        <p className="text-gray-400">Camisetas de clubes argentinos, stock disponible para entrega inmediata</p>
      </div>

      {clubs.length > 1 && (
        <div className="flex justify-center gap-2 flex-wrap mb-10">
          <button
            onClick={() => setClubFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
              clubFilter === 'all' ? 'border-arg-blue bg-arg-blue text-white' : 'border-gray-200 text-gray-500 hover:border-arg-blue'
            }`}
          >
            Todos
          </button>
          {clubs.map(club => (
            <button
              key={club}
              onClick={() => setClubFilter(club)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                clubFilter === club ? 'border-arg-blue bg-arg-blue text-white' : 'border-gray-200 text-gray-500 hover:border-arg-blue'
              }`}
            >
              {club}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-20">
          Sin productos disponibles. Ejecutá <code>npm run seed</code> en el backend.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
