function getConfig(req, res) {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
}

module.exports = { getConfig };
