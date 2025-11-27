import { MongoClient, ServerApiVersion } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGO_URI;

console.log('Environment check:', {
  MONGO_URI_exists: !!process.env.MONGO_URI,
  MONGO_URI_length: process.env.MONGO_URI?.length || 0
});

if (!uri) {
  console.error('❌ MONGO_URI environment variable is not defined');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
  throw new Error('MONGO_URI environment variable is required');
}

// Function to create a new MongoDB client for each operation
export function createMongoClient() {
  return new MongoClient(uri!, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 105000,

    connectTimeoutMS: 15000,
    socketTimeoutMS: 15000,
    maxPoolSize: 2,
    minPoolSize: 1,
    retryWrites: true,
    retryReads: true,
    family: 4, // Force IPv4
    directConnection: false,
  });
}

// Helper function for database operations
export async function withMongoDB<T>(operation: (client: MongoClient) => Promise<T>): Promise<T> {
  const client = createMongoClient();
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    
    // Test the connection
    await client.db('admin').command({ ping: 1 });
    console.log('✅ MongoDB connected successfully');
    
    const result = await operation(client);
    return result;
  } catch (error) {
    console.error('❌ MongoDB operation failed:', error);
    throw error;
  } finally {
    try {
      await client.close();
      console.log('📴 MongoDB connection closed');
    } catch (closeError) {
      console.error('Error closing MongoDB connection:', closeError);
    }
  }
}

// Legacy function for backward compatibility
export default function mongo() {
  return createMongoClient();
}