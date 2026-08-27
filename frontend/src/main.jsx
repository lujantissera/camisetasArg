import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

// En dev queda vacío (rutas relativas, redirigidas por el proxy de vite.config.js a localhost:3001).
// En producción, VITE_API_URL apunta al backend real (ej. https://camisetas-arg-backend.onrender.com)
// porque frontend y backend viven en dominios distintos (Vercel / Render).
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

const domain   = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
        scope: 'openid profile email',
      }}
    >
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);
