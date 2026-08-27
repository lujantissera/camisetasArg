import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { proxyImageUrl } from '../lib/images';

const FALLBACK_IMG = 'https://placehold.co/80x80/74ACDF/FFFFFF?text=ARG';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, subtotal, itemCount } = useCart();
  const navigate = useNavigate();
  const [shippingOptions, setShippingOptions] = useState([]);
  const [shippingId, setShippingId] = useState('standard');

  useEffect(() => {
    axios.get('/api/shipping-options').then(r => setShippingOptions(r.data)).catch(() => {});
  }, []);

  const shipping = shippingOptions.find(o => o.id === shippingId);
  const total = subtotal + (shipping?.price || 0);
  const hasStock = items.some(i => i.type === 'stock');
  const hasOnDemand = items.some(i => i.type === 'on_demand');

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-32 text-center">
        <div className="text-8xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-3">Tu carrito está vacío</h2>
        <p className="text-gray-400 mb-8">Elegí tu camiseta favorita en la tienda.</p>
        <Link to="/shop" className="btn-primary">Ir a la tienda</Link>
      </div>
    );
  }

  function handleCheckout() {
    navigate('/checkout', { state: { shippingMethod: shippingId, shippingCost: shipping?.price ?? 0 } });
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl text-arg-blue-dk tracking-wider mb-4">
        TU CARRITO ({itemCount})
      </h1>

      {hasStock && hasOnDemand && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          ℹ️ Tu pedido mezcla productos en stock y a pedido — te van a llegar por separado, con
          tiempos de entrega distintos (hasta 5 días los de stock, ~20 días los de pedido).
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Item list */}
        <div className="lg:col-span-3 space-y-4">
          {items.map(item => (
            <div key={item.variantId} className="card p-4 flex items-center gap-4">
              <img
                src={proxyImageUrl(item.imageUrl) || FALLBACK_IMG}
                alt={item.productName}
                className="w-20 h-20 object-cover rounded-xl shrink-0"
                onError={e => { e.target.src = FALLBACK_IMG; }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{item.productName}</p>
                <p className="text-sm text-gray-400">Talle: <strong>{item.size}</strong></p>
                <p className="text-arg-gold font-bold text-sm mt-0.5">€{item.price.toFixed(2)} c/u</p>
                <p className={`text-xs mt-0.5 ${item.type === 'on_demand' ? 'text-amber-600' : 'text-green-600'}`}>
                  {item.type === 'on_demand' ? '🕒 A pedido — 20 días' : '📦 En stock — 5 días'}
                </p>
              </div>

              {/* Qty stepper */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 flex items-center justify-center transition-colors"
                >−</button>
                <span className="w-7 text-center font-semibold text-gray-800">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 flex items-center justify-center transition-colors"
                >+</button>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-gray-800">€{(item.price * item.quantity).toFixed(2)}</p>
                <button
                  onClick={() => removeFromCart(item.variantId)}
                  className="text-xs text-red-400 hover:text-red-600 mt-1 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          <Link to="/shop" className="inline-block text-sm text-arg-blue hover:underline mt-2">
            ← Seguir comprando
          </Link>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Shipping selector */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-800 mb-4">🚚 Método de envío</h3>
            <div className="space-y-3">
              {shippingOptions.map(opt => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    shippingId === opt.id
                      ? 'border-arg-blue bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={opt.id}
                    checked={shippingId === opt.id}
                    onChange={() => setShippingId(opt.id)}
                    className="accent-arg-blue"
                  />
                  <span className="text-xl">{opt.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-700 text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                  <span className="font-bold text-gray-800 text-sm">
                    {opt.price === 0 ? 'Gratis' : `€${opt.price}`}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-800 mb-4">Resumen</h3>
            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({itemCount} art.)</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Envío ({shipping?.label || '...'})</span>
                <span>{(shipping?.price ?? 0) === 0 ? 'Gratis' : `€${(shipping?.price ?? 0).toFixed(2)}`}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-800">
                <span>Total</span>
                <span className="text-arg-blue-dk">€{total.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handleCheckout} className="btn-primary w-full">
              💳 Proceder al pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
