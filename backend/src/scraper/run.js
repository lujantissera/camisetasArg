const { fetchCategoryAlbums, fetchAlbumImages } = require('./yupooClient');
const { parseTitle } = require('./titleParser');
const productsService = require('../services/products.service');
const { CATEGORIES, ONDEMAND_PRICE, MIN_EXPECTED_PRODUCTS, FETCH_DELAY_MS } = require('./config');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Orquesta el scrape completo y el upsert. No maneja el ciclo de vida de la conexión a DB
// (initDB/close) — eso es responsabilidad del caller (cli.js para `npm run scrape`, o el
// servidor Express ya corriendo para el endpoint de admin).
async function scrapeAndUpsert() {
  const albumsByUrl = new Map();

  for (const category of CATEGORIES) {
    let albums;
    try {
      albums = await fetchCategoryAlbums(category.url);
    } catch (err) {
      // Si falla el listado de una categoría, abortamos toda la corrida sin tocar la DB —
      // mejor no actualizar nada que desactivar productos por un error de red transitorio.
      throw new Error(`No se pudo listar la categoría "${category.label}": ${err.message}`);
    }
    for (const album of albums) albumsByUrl.set(album.url, album);
  }

  const allWarnings = [];
  const scrapedProducts = [];

  for (const album of albumsByUrl.values()) {
    let images;
    try {
      images = await fetchAlbumImages(album.url);
    } catch (err) {
      allWarnings.push(`Álbum saltado por error de fetch (${album.url}): ${err.message}`);
      continue;
    }
    if (images.length === 0) {
      allWarnings.push(`Álbum sin fotos, salteado: ${album.url} ("${album.title}")`);
      continue;
    }

    const { name, club, version, warnings } = parseTitle(album.title);
    allWarnings.push(...warnings);

    scrapedProducts.push({
      sourceUrl: album.url,
      name,
      club,
      version,
      imageUrls: images,
      price: ONDEMAND_PRICE,
    });

    await sleep(FETCH_DELAY_MS);
  }

  if (scrapedProducts.length < MIN_EXPECTED_PRODUCTS) {
    throw new Error(
      `Solo se scrapearon ${scrapedProducts.length} productos (mínimo esperado: ${MIN_EXPECTED_PRODUCTS}). ` +
      `Abortando sin tocar la DB — probablemente el sitio cambió de estructura HTML.`
    );
  }

  const summary = await productsService.upsertOnDemandCatalog(scrapedProducts);

  if (allWarnings.length) {
    console.warn(`⚠️ ${allWarnings.length} advertencias durante el scrape:`);
    allWarnings.forEach(w => console.warn(`  - ${w}`));
  }

  return { ...summary, scraped: scrapedProducts.length, warnings: allWarnings };
}

module.exports = { scrapeAndUpsert };
