// Minimal Express server to receive pickup events and save to MongoDB
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || '';
const DB_NAME = process.env.MONGO_DB || 'trip_tracker';

let client;
let db;

async function connectMongo() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI not set. Create .env with MONGO_URI=mongodb+srv://...');
  }
  client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  db = client.db(DB_NAME);
  await db.command({ ping: 1 });
  console.log('Connected to MongoDB');
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// List recent pickups with optional filters
app.get('/api/pickups', async (req, res) => {
  try {
    const { limit = 20, unit, route, date } = req.query;
    const query = {};
    if (unit) query.unit = String(unit);
    if (route) query.route = String(route);
    if (date) query.date = String(date);
    const docs = await db
      .collection('pickups')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .toArray();
    res.json({ ok: true, count: docs.length, items: docs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list pickups' });
  }
});

// Record passenger pickup
app.post('/api/pickups', async (req, res) => {
  try {
    const payload = req.body || {};
    // Basic validation
    const required = ['unit', 'route', 'time', 'location', 'passengerNumber'];
    for (const key of required) {
      if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
        return res.status(400).json({ error: `Missing field: ${key}` });
      }
    }
    const doc = {
      type: 'pickup',
      unit: String(payload.unit),
      route: String(payload.route),
      time: new Date(payload.time).toISOString(),
      passengerNumber: Number(payload.passengerNumber),
      location: {
        lat: Number(payload.location.lat),
        lng: Number(payload.location.lng),
        accuracy: payload.location.accuracy != null ? Number(payload.location.accuracy) : undefined,
      },
      date: payload.date || new Date().toISOString().split('T')[0],
      createdAt: new Date(),
    };
    const result = await db.collection('pickups').insertOne(doc);
    res.json({ ok: true, id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save pickup' });
  }
});

// Record trip end summary
app.post('/api/trips/end', async (req, res) => {
  try {
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
    res.json({ ok: true, id: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save trip end' });
  }
});

async function start() {
  try {
    await connectMongo();
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  } catch (e) {
    console.error('Startup error:', e.message);
    process.exit(1);
  }
}

start();


