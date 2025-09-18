const { getDb } = require('./_mongo');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const db = await getDb();
    if (req.method === 'POST') {
      const payload = req.body || {};
      const required = ['unit', 'route', 'time', 'passengerNumber'];
      for (const k of required) {
        if (payload[k] === undefined || payload[k] === null || payload[k] === '') {
          return res.status(400).json({ error: `Missing field: ${k}` });
        }
      }
      const doc = {
        type: 'pickup',
        unit: String(payload.unit),
        route: String(payload.route),
        time: new Date(payload.time).toISOString(),
        passengerNumber: Number(payload.passengerNumber),
        location: payload.location || null,
        date: payload.date || new Date().toISOString().split('T')[0],
        createdAt: new Date(),
      };
      const result = await db.collection('pickups').insertOne(doc);
      return res.status(200).json({ ok: true, id: result.insertedId });
    }

    // GET recent pickups
    if (req.method === 'GET') {
      const { limit = 20, unit, route, date } = req.query || {};
      const query = {};
      if (unit) query.unit = String(unit);
      if (route) query.route = String(route);
      if (date) query.date = String(date);
      const items = await db.collection('pickups')
        .find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .toArray();
      return res.status(200).json({ ok: true, count: items.length, items });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error', message: e.message });
  }
};


