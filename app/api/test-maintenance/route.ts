// Test endpoint to verify maintenance mode is working
import { NextResponse } from 'next/server';
import { isMaintenanceMode } from '@/lib/maintenance-mode';
import { getSettings } from '@/lib/settings';
import { getRedisClient } from '@/lib/redis';

export async function GET() {
  try {
    const redisValue = await isMaintenanceMode();
    const dbSettings = await getSettings();
    const redis = getRedisClient();
    
    // Check Redis directly
    let redisDirectCheck = null;
    if (redis) {
      try {
        const directValue = await redis.get<string>('maintenance:mode');
        redisDirectCheck = directValue === 'on';
      } catch (err) {
        redisDirectCheck = `Error: ${err}`;
      }
    } else {
      redisDirectCheck = 'Redis not configured (REDIS_URL or REDIS_REST_TOKEN missing)';
    }
    
    return NextResponse.json({
      redis: redisValue,
      redisDirect: redisDirectCheck,
      database: dbSettings.maintenanceMode,
      match: redisValue === dbSettings.maintenanceMode,
      redisConfigured: !!redis,
      env: {
        hasRedisUrl: !!process.env.REDIS_URL,
        hasRedisRestToken: !!process.env.REDIS_REST_TOKEN,
      },
      status: redisValue ? 'MAINTENANCE MODE ENABLED' : 'MAINTENANCE MODE DISABLED',
      message: !redis 
        ? '⚠️ WARNING: Redis is not configured. Maintenance mode will not work properly!'
        : redisValue !== dbSettings.maintenanceMode
        ? '⚠️ WARNING: Redis and Database are out of sync!'
        : '✅ Maintenance mode is properly configured',
    });
  } catch (error) {
    console.error('Error testing maintenance mode:', error);
    return NextResponse.json(
      { error: 'Failed to test maintenance mode', details: String(error) },
      { status: 500 }
    );
  }
}

