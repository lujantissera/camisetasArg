import axios from 'axios';

// Yupoo bloquea el hotlink directo de sus fotos (protección anti-hotlink por Referer).
// Las reescribimos para que pasen por nuestro propio backend, que sí puede pedírselas.
// Las fotos de stock (rutas locales /images/products/...) quedan sin tocar.
export function proxyImageUrl(url) {
  if (!url || !url.includes('photo.yupoo.com')) return url;
  return `${axios.defaults.baseURL}/api/image-proxy?url=${encodeURIComponent(url)}`;
}
