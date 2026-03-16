import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

let stripePromise = null;
async function getStripeInstance() {
  if (!stripePromise) {
    const { data } = await axios.get('/api/payments/config');
    stripePromise = loadStripe(data.publishableKey);
  }
  return stripePromise;
}

// ── Stripe payment form ────────────────────────────────────────────────────────
function StripeForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message);
      setBusy(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      <button type="submit" disabled={!stripe || busy} className="btn-primary w-full">
        {busy ? '⏳ Procesando pago...' : '🔒 Confirmar y pagar'}
      </button>
      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
        <span>🔒</span> Pago seguro procesado por Stripe
      </p>
    </form>
  );
}

// ── Checkout page ──────────────────────────────────────────────────────────────
const FIELDS = [
  { key: 'fullName',    label: 'Nombre completo',   placeholder: 'Juan García' },
  { key: 'street',      label: 'Dirección',          placeholder: 'Calle Mayor 123, 2° izq.' },
  { key: 'city',        label: 'Ciudad',             placeholder: 'Madrid' },
  { key: 'postalCode',  label: 'Código postal',      placeholder: '28001' },
  { key: 'country',     label: 'País',               placeholder: 'España' },
];

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();
  const { items, subtotal, clearCart } = useCart();

  const shippingMethod = state?.shippingMethod || 'standard';
  const shippingCost   = state?.shippingCost   ?? 5;
  const grandTotal     = subtotal + shippingCost;

  const [step, setStep]               = useState('address'); // 'address' | 'payment'
  const [busy, setBusy]               = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [stripeObj, setStripeObj]     = useState(null);
  const [address, setAddress]         = useState({
    fullName: '', street: '', city: '', postalCode: '', country: 'España',
  });

  if (!items.length) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500 mb-4">Tu carrito está vacío.</p>
        <Link to="/shop" className="btn-primary">Ir a la tienda</Link>
      </div>
    );
  }

  async function handleAddressSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const token   = await getAccessTokenSilently();
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Create draft order
      const { data: order } = await axios.post('/api/orders', {}, { headers });

      // 2. Add items
      for (const item of items) {
        await axios.post(
          `/api/orders/${order.id}/items`,
          { variantId: item.variantId, quantity: item.quantity },
          { headers }
        );
      }

      // 3. Set shipping
      await axios.put(
        `/api/orders/${order.id}/shipping`,
        { shippingMethod, shippingAddress: address },
        { headers }
      );

      // 4. Confirm → get Stripe client secret
      const { data: confirmed } = await axios.post(`/api/orders/${order.id}/confirm`, {}, { headers });

      const stripe = await getStripeInstance();
      setStripeObj(stripe);
      setClientSecret(confirmed.clientSecret);
      setStep('payment');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Error al procesar. Intentá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  function handleSuccess() {
    clearCart();
    toast.success('¡Pago exitoso! 🎉 Tu camiseta está en camino.');
    navigate('/orders');
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-4xl text-arg-blue-dk tracking-wider mb-2">CHECKOUT</h1>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { id: 'address', label: 'Datos de envío' },
          { id: 'payment', label: 'Pago' },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-gray-300" />}
            <div className={`flex items-center gap-2 text-sm font-medium ${step === s.id ? 'text-arg-blue-dk' : 'text-gray-400'}`}>
              <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${step === s.id ? 'bg-arg-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i + 1}
              </span>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: form or payment */}
        <div className="lg:col-span-3">
          {step === 'address' && (
            <div className="card p-6">
              <h2 className="font-bold text-xl text-gray-800 mb-6">📦 Dirección de envío</h2>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <input
                      type="text"
                      required
                      placeholder={f.placeholder}
                      value={address[f.key]}
                      onChange={e => setAddress(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="input"
                    />
                  </div>
                ))}
                <button type="submit" disabled={busy} className="btn-primary w-full mt-2">
                  {busy ? '⏳ Procesando...' : 'Continuar al pago →'}
                </button>
              </form>
            </div>
          )}

          {step === 'payment' && clientSecret && stripeObj && (
            <div className="card p-6">
              <h2 className="font-bold text-xl text-gray-800 mb-6">💳 Pago seguro</h2>
              <Elements stripe={stripeObj} options={{ clientSecret, locale: 'es' }}>
                <StripeForm onSuccess={handleSuccess} />
              </Elements>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-arg-blue-d border border-arg-blue/20">
                🧪 <strong>Modo test:</strong> Tarjeta{' '}
                <code className="bg-white px-1 rounded">4242 4242 4242 4242</code>,
                cualquier fecha futura, cualquier CVC.
              </div>
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-2 card p-6 h-fit">
          <h2 className="font-bold text-xl text-gray-800 mb-4">Resumen del pedido</h2>
          <div className="space-y-2 mb-4">
            {items.map(item => (
              <div key={item.variantId} className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {item.productName} ({item.size}) × {item.quantity}
                </span>
                <span className="font-medium text-gray-700">
                  €{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Envío ({shippingMethod})</span>
              <span>{shippingCost === 0 ? 'Gratis' : `€${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 text-arg-blue-dk">
              <span>Total</span>
              <span>€{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {step === 'payment' && (
            <div className="mt-4 pt-4 border-t text-sm text-gray-400 space-y-0.5">
              <p className="font-medium text-gray-600">📍 Envío a:</p>
              <p>{address.fullName}</p>
              <p>{address.street}</p>
              <p>{address.city} {address.postalCode}, {address.country}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
