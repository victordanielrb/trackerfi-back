import { MongoClient, ServerApiVersion, Db } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI environment variable is not defined');
  throw new Error('MONGO_URI environment variable is required');
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  retryReads: true,
  family: 4,
});

let connectPromise: Promise<MongoClient> | null = null;

function ensureConnected(): Promise<MongoClient> {
  if (!connectPromise) {
    connectPromise = client.connect().then(c => {
      console.log('MongoDB connected (persistent pool)');
      return c;
    });
  }
  return connectPromise;
}

/**
 * Get the trackerfi database using the persistent connection pool.
 * This is the only export consumers need.
 */
export async function getDb(dbName = 'trackerfi'): Promise<Db> {
  await ensureConnected();
  return client.db(dbName);
}

/**
 * Graceful shutdown — call from process signal handlers.
 */
export async function closeMongoDB() {
  if (connectPromise) {
    await client.close();
    connectPromise = null;
    console.log('MongoDB connection closed');
  }
}
