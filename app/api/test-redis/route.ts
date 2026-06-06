import { NextResponse } from 'next/server';
import { getRedisClient, getCacheStats } from '@/lib/redis';

// Test endpoint to verify Redis connection (remove in production or protect with auth)
export async function GET() {
  try {
    const stats = await getCacheStats();
    const redis = getRedisClient();
    
    // Test basic operations
    const testKey = 'test:connection';
    const testValue = `test-${Date.now()}`;
    
    if (redis) {
      // Upstash uses set with ex option
      await redis.set(testKey, testValue, { ex: 60 });
      const retrieved = await redis.get<string>(testKey);
      await redis.del(testKey);
      
      return NextResponse.json({
        status: 'connected',
        stats,
        test: {
          set: true,
          get: retrieved === testValue,
          delete: true,
        },
        redisUrl: process.env.REDIS_URL ? 'configured' : 'not configured',
        redisRestToken: process.env.REDIS_REST_TOKEN ? 'configured' : 'not configured',
      });
    }
    
    return NextResponse.json({
      status: 'not connected',
      stats,
      redisUrl: process.env.REDIS_URL ? 'configured' : 'not configured',
      redisToken: process.env.REDIS_TOKEN ? 'configured' : 'not configured',
      message: 'Redis client not available. Check REDIS_URL and REDIS_REST_TOKEN environment variables.',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      redisUrl: process.env.REDIS_URL ? 'configured' : 'not configured',
      redisToken: process.env.REDIS_TOKEN ? 'configured' : 'not configured',
    }, { status: 500 });
  }
}

