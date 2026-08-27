const { Readable } = require('stream');

// Yupoo bloquea el hotlink de sus fotos por Referer — solo permite pedidos que "vengan" de
// su propio sitio. Este proxy hace el fetch server-side (mandando el Referer correcto) y le
// devuelve la imagen al navegador desde nuestro propio dominio, evitando el bloqueo.
// Restringido a photo.yupoo.com únicamente — nunca actúa como proxy abierto de cualquier URL.
const ALLOWED_HOST = 'photo.yupoo.com';
const YUPOO_REFERER = 'https://classic-football-fhirts052.x.yupoo.com/';

async function proxyImage(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url is required' });

  let target;
  try {
    target = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid url' });
  }
  if (target.hostname !== ALLOWED_HOST) {
    return res.status(400).json({ error: 'Host not allowed' });
  }

  try {
    const upstream = await fetch(target, {
      headers: {
        Referer: YUPOO_REFERER,
        'User-Agent': 'Mozilla/5.0 (compatible; CamisetasArgBot/1.0)',
      },
    });
    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ error: 'Upstream fetch failed' });
    }

    res.set('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=604800, immutable'); // 7 días — son fotos estáticas
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error('Image proxy error:', err.message);
    res.status(502).json({ error: 'Image proxy error' });
  }
}

module.exports = { proxyImage };
