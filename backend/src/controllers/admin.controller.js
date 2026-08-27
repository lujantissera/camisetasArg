const { scrapeAndUpsert } = require('../scraper/run');

// No espera a que termine el scrape (puede tardar 1-3 min con el delay educado entre
// fetches) — responde 202 al toque para evitar timeouts de request en el cron/Render, y el
// resultado queda en los logs del servidor.
function triggerScrape(req, res) {
  res.status(202).json({ status: 'started' });
  scrapeAndUpsert()
    .then(result => {
      console.log(
        `✅ Scrape (admin trigger) completo: ${result.scraped} vistos — ${result.inserted} nuevos, ` +
        `${result.updated} actualizados, ${result.deactivated} desactivados.`
      );
    })
    .catch(err => console.error('❌ Scrape (admin trigger) failed:', err));
}

module.exports = { triggerScrape };
