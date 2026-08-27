// Secreto compartido simple, no un sistema de auth de admin completo — hay un solo caller
// (el cron de GitHub Actions), no vale la pena más que esto.
function scrapeAuth(req, res, next) {
  const secret = req.headers['x-scrape-secret'];
  if (!process.env.SCRAPE_SECRET || secret !== process.env.SCRAPE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { scrapeAuth };
