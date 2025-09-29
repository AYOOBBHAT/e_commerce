import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local. ' +
    'You can get a free MongoDB Atlas connection string at https://www.mongodb.com/atlas'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */

declare global {
  var mongooseConn: Promise<typeof mongoose> | undefined;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!global.mongooseConn) {
    const opts = { bufferCommands: false };
    global.mongooseConn = mongoose.connect(MONGODB_URI, opts);
  }
  return global.mongooseConn;
}