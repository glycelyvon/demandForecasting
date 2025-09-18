const { getDb } = require('./_mongo');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const hasUri = Boolean(process.env.MONGO_URI);
    if (!hasUri) return res.status(500).json({ ok: false, error: 'MONGO_URI missing' });
    const db = await getDb();
    const ping = await db.command({ ping: 1 });
    return res.status(200).json({ ok: true, ping, db: process.env.MONGO_DB || 'triptracker' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};


