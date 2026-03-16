import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useCart } from '../context/CartContext';

function CartIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-arg-blue' : 'text-gray-600 hover:text-arg-blue-d'
  }`;

export default function Navbar() {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl leading-none">⭐⭐⭐</span>
          <span className="font-display text-2xl tracking-widest text-arg-blue-dk hidden sm:block">
            LA CAMISETA
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/"      className={linkClass}>Inicio</NavLink>
          <NavLink to="/shop"  className={linkClass}>Tienda</NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className={linkClass}>Mis Pedidos</NavLink>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link to="/cart" className="relative p-2 text-gray-600 hover:text-arg-blue transition-colors">
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-arg-gold text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {!isLoading && (
            isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm text-gray-500 truncate max-w-[120px]">
                  {user?.name || user?.email}
                </span>
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="text-sm border border-gray-300 hover:border-gray-400 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button onClick={() => loginWithRedirect()} className="btn-primary text-sm py-2 px-4">
                Ingresar
              </button>
            )
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileOpen(v => !v)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t px-4 py-3 space-y-3">
          <NavLink to="/"      className={linkClass} onClick={() => setMobileOpen(false)}>Inicio</NavLink>
          <NavLink to="/shop"  className={linkClass} onClick={() => setMobileOpen(false)}>Tienda</NavLink>
          {isAuthenticated && (
            <NavLink to="/orders" className={linkClass} onClick={() => setMobileOpen(false)}>Mis Pedidos</NavLink>
          )}
          {isAuthenticated && (
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="block text-sm text-red-500"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
