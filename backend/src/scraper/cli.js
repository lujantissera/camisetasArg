require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { getDB, initDB } = require('../db/database');
const { scrapeAndUpsert } = require('./run');

async function main() {
  await initDB();
  const result = await scrapeAndUpsert();
  console.log(
    `✅ Scrape completo: ${result.scraped} productos vistos — ${result.inserted} nuevos, ` +
    `${result.updated} actualizados, ${result.deactivated} desactivados.`
  );
}

main()
  .catch(err => {
    console.error('❌ Scrape failed:', err);
    process.exitCode = 1;
  })
  .finally(() => getDB().close?.());
