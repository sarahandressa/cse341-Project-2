// scripts/debug-db.js
const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  // Fallback para Mongo local se MONGO_URI não estiver setada
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bc';
  console.log('Connecting using MONGO_URI:', uri);

  try {
    // Sem useNewUrlParser / useUnifiedTopology (removidos em versões novas)
    const conn = await mongoose.connect(uri);
    const db = conn.connection.db;

    console.log('Connected to database name:', db.databaseName);

    const collections = await db.listCollections().toArray();
    console.log('Collections in DB:', collections.map(c => c.name));

    // Count documents in 'clubs' collection
    const clubsCount = await db.collection('clubs').countDocuments();
    console.log('clubs count:', clubsCount);

    if (clubsCount > 0) {
      const docs = await db.collection('clubs').find({}).limit(5).toArray();
      console.log('Sample docs (up to 5):', JSON.stringify(docs, null, 2));
    } else {
      console.log('No documents found in collection "clubs".');
    }

    // show indexes on clubs collection (optional)
    try {
      const indexes = await db.collection('clubs').indexes();
      console.log('Indexes on clubs:', indexes);
    } catch (e) {
      console.log('Could not fetch indexes for clubs:', e.message);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error connecting or querying DB:', err);
    process.exit(1);
  }
}

main();
