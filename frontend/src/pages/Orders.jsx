import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const STATUS = {
  draft:           { label: 'Borrador',         bg: 'bg-gray-100',    text: 'text-gray-600'  },
  pending_payment: { label: 'Pago pendiente',   bg: 'bg-yellow-100',  text: 'text-yellow-700' },
  paid:            { label: '✓ Pagado',          bg: 'bg-green-100',   text: 'text-green-700'  },
  shipped:         { label: '🚚 Enviado',        bg: 'bg-blue-100',    text: 'text-blue-700'   },
  cancelled:       { label: 'Cancelado',         bg: 'bg-red-100',     text: 'text-red-600'    },
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function Orders() {
  const { getAccessTokenSilently } = useAuth0();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessTokenSilently();
        const { data } = await axios.get('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Hide empty draft orders (abandoned carts)
        setOrders(data.filter(o => o.status !== 'draft' || (o.items?.length > 0)));
      } catch {
        toast.error('Error al cargar los pedidos');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getAccessTokenSilently]);

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <div className="w-12 h-12 rounded-full border-4 border-arg-blue border-t-transparent animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-32 px-6">
        <div className="text-8xl mb-6">📦</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-3">Sin pedidos aún</h2>
        <p className="text-gray-400 mb-8">Comprá tu primera camiseta y aparecerá aquí.</p>
        <Link to="/shop" className="btn-primary">Ir a la tienda</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl text-arg-blue-dk tracking-wider mb-8">
        MIS PEDIDOS ({orders.length})
      </h1>

      <div className="space-y-6">
        {orders.map(order => {
          const s = STATUS[order.status] || STATUS.draft;
          let addr = null;
          try { addr = order.shipping_address ? JSON.parse(order.shipping_address) : null; } catch {}

          return (
            <div key={order.id} className="card p-6">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <p className="font-bold text-gray-800 text-lg">Pedido #{String(order.id).padStart(4, '0')}</p>
                  <p className="text-sm text-gray-400">{formatDate(order.created_at)}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${s.bg} ${s.text}`}>
                  {s.label}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-5">
                {order.items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {item.product_name}
                      <span className="text-gray-400"> — Talle {item.size} × {item.quantity}</span>
                    </span>
                    <span className="font-medium text-gray-700">
                      €{(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Subtotal</p>
                  <p className="font-semibold">€{(order.subtotal ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Envío</p>
                  <p className="font-semibold">
                    {order.shipping_cost === 0 ? 'Gratis' : `€${(order.shipping_cost ?? 0).toFixed(2)}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total</p>
                  <p className="font-bold text-arg-blue-dk text-base">€{(order.total ?? 0).toFixed(2)}</p>
                </div>
              </div>

              {addr && (
                <p className="mt-4 text-xs text-gray-400">
                  📍 {addr.fullName} · {addr.street}, {addr.city} {addr.postalCode}, {addr.country}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
