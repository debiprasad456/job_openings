import { MongoClient } from 'mongodb';
import dns from 'dns';

// Fix for Windows / certain ISP DNS SRV resolution issues in local node environment
if (typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if not supported in environment
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI environment variable is missing.');
}

let cachedClient = global._mongoClient;

export async function getDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  if (cachedClient) {
    return cachedClient.db('diverse-solutions');
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    await client.connect();
    global._mongoClient = client;
    cachedClient = client;
    return client.db('diverse-solutions');
  } catch (err) {
    console.error('[MongoDB Error]', err);
    if (err.message.includes('bad auth') || err.code === 8000) {
      throw new Error('MongoDB Atlas authentication failed. Please check your Database User credentials (username/password) in MongoDB Atlas and update MONGODB_URI in Vercel / .env.');
    }
    if (err.name === 'MongoServerSelectionError' || err.message.includes('connect ECONNREFUSED')) {
      throw new Error('MongoDB Atlas connection timed out. Please ensure Network Access in MongoDB Atlas allows IP 0.0.0.0/0 (Allow Access from Anywhere) for Vercel.');
    }
    throw err;
  }
}
