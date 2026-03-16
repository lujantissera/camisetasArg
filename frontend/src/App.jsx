import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';

function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-12 h-12 rounded-full border-4 border-arg-blue border-t-transparent animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) { loginWithRedirect(); return null; }
  return children;
}

export default function App() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/shop"    element={<Shop />} />
          <Route path="/cart"    element={<Cart />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders"  element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </CartProvider>
  );
}
