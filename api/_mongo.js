// Shared MongoDB connection helper for Vercel serverless functions
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://glycelvirtucio_db_user:<db_password>@cluster0.zrqzom3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

let cached = global.__mongoCached;
if (!cached) {
  cached = global.__mongoCached = { client: null, db: null };
}

async function getDb() {
  if (cached.db) return cached.db;
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB || 'triptracker';
  if (!uri) {
    throw new Error('Missing MONGO_URI environment variable');
  }
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  cached.client = client;
  cached.db = client.db(dbName);
  return cached.db;
}

module.exports = { getDb };


