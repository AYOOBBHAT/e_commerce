import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

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