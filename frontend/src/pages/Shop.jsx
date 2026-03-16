import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

const SIZES = ['S', 'M', 'L', 'XL'];
const FALLBACK_IMG = 'https://placehold.co/400x320/74ACDF/FFFFFF?text=ARG+⭐⭐⭐';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(null);

  function getVariant(size) {
    return product.variants?.find(v => v.size === size);
  }

  function handleAdd() {
    if (!selectedSize) { toast.error('Seleccioná un talle primero'); return; }
    const variant = getVariant(selectedSize);
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
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 mb-1 text-base leading-snug">{product.name}</h3>
        <p className="text-sm text-gray-400 mb-4 flex-1 line-clamp-2">{product.description}</p>

        {/* Size selector */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Talle {selectedSize && <span className="text-arg-blue">— {selectedSize} seleccionado</span>}
          </p>
          <div className="flex gap-2">
            {SIZES.map(size => {
              const v = getVariant(size);
              const inStock = v && v.stock > 0;
              return (
                <button
                  key={size}
                  disabled={!inStock}
                  onClick={() => setSelectedSize(size)}
                  title={inStock ? `Stock: ${v.stock}` : 'Sin stock'}
                  className={`w-12 h-10 rounded-lg text-sm font-semibold border-2 transition-all ${
                    selectedSize === size
                      ? 'border-arg-blue bg-arg-blue text-white shadow-md'
                      : inStock
                      ? 'border-gray-300 text-gray-600 hover:border-arg-blue hover:text-arg-blue'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                  }`}
                >
                  {size}
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

  useEffect(() => {
    axios.get('/api/products')
      .then(r => setProducts(r.data))
      .catch(() => toast.error('Error al cargar los productos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-12 h-12 rounded-full border-4 border-arg-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="font-display text-5xl text-arg-blue-dk tracking-wider mb-2">
          NUESTRA COLECCIÓN
        </h1>
        <p className="text-gray-400">
          Todos los modelos · Talles S, M, L, XL · <span className="text-arg-gold font-semibold">€20 c/u</span>
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-400 py-20">
          Sin productos disponibles. Ejecutá <code>npm run seed</code> en el backend.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
