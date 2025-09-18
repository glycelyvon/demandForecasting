const { getDb } = require('../_mongo');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDb();
    const { unit, route, endTime, totalPassengers } = req.body || {};
    if (!unit || !route || !endTime || totalPassengers == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const doc = {
      type: 'tripEnd',
      unit: String(unit),
      route: String(route),
      endTime: new Date(endTime).toISOString(),
      totalPassengers: Number(totalPassengers),
      createdAt: new Date(),
    };
    const result = await db.collection('trips').insertOne(doc);
    return res.status(200).json({ ok: true, id: result.insertedId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
};


