const cheerio = require('cheerio');

const USER_AGENT = 'Mozilla/5.0 (compatible; CamisetasArgBot/1.0)';

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'es,en;q=0.8' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

// Lista de álbumes (productos) de una categoría. El título real está en el atributo `title`
// del <a>, no en su texto visible. Normaliza la URL a `.../albums/{id}?uid=1` — el `uid` es el
// id del vendedor y es OBLIGATORIO (la página del álbum devuelve 404 sin él); el resto del
// querystring (`isSubCate`, `referrercate`) es ruido de tracking que varía según desde qué
// categoría se llega al mismo álbum, así que se descarta para tener una source_url estable
// entre corridas (necesaria para el upsert por source_url).
async function fetchCategoryAlbums(categoryUrl) {
  const html = await fetchHtml(categoryUrl);
  const $ = cheerio.load(html);
  const albums = [];

  $('a.album__main[href*="/albums/"]').each((_, el) => {
    const href = $(el).attr('href');
    const title = $(el).attr('title');
    if (!href || !title) return;
    const parsed = new URL(href, categoryUrl);
    const uid = parsed.searchParams.get('uid') || '1';
    const url = `${parsed.origin}${parsed.pathname}?uid=${uid}`;
    albums.push({ url, title: title.trim() });
  });

  return [...new Map(albums.map(a => [a.url, a])).values()];
}

// Fotos de un álbum: solo el tamaño "big" (no thumbnails "square"), dedupeadas.
async function fetchAlbumImages(albumUrl) {
  const html = await fetchHtml(albumUrl);
  const $ = cheerio.load(html);
  const images = new Set();

  $('img[data-src]').each((_, el) => {
    const src = $(el).attr('data-src');
    if (src && /^https:\/\/photo\.yupoo\.com\/.*\/big\.jpg$/.test(src)) {
      images.add(src);
    }
  });

  return [...images];
}

module.exports = { fetchCategoryAlbums, fetchAlbumImages };
