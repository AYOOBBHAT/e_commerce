// Edge-safe maintenance mode check using Redis only
// This file can be imported in middleware (Edge Runtime) without mongoose
import { getRedisClient } from './redis';

// In-memory fallback (defaults to false)
// NOTE: This cache is per-instance and will reset on serverless function restart
// For production, Redis MUST be configured for maintenance mode to work reliably
let maintenanceModeCache = false;

/**
 * Check maintenance mode from Redis (fast - used by middleware)
 * Edge Runtime safe - no mongoose/DB imports
 * 
 * FALLBACK: If Redis is not available, this will return false (maintenance mode disabled)
 * For production, Redis MUST be configured for maintenance mode to work.
 */
export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      // Fallback to in-memory cache if Redis unavailable
      // IMPORTANT: This means maintenance mode won't work if Redis is not configured!
      const hasRedisEnv = !!(process.env.REDIS_URL && process.env.REDIS_REST_TOKEN);
      if (!hasRedisEnv) {
        // Only log error once per instance to avoid spam
        if (maintenanceModeCache === false) {
          console.error('[MaintenanceMode] ⚠️ CRITICAL: Redis not configured! REDIS_URL and REDIS_REST_TOKEN must be set for maintenance mode to work.');
          console.error('[MaintenanceMode] Maintenance mode is DISABLED because Redis is not available.');
        }
      } else {
        console.warn('[MaintenanceMode] Redis client not available (check connection), using cache:', maintenanceModeCache);
      }
      return maintenanceModeCache;
    }
    
    const maintenance = await redis.get<string>('maintenance:mode');
    const isEnabled = maintenance === 'on';
    
    // Update cache
    maintenanceModeCache = isEnabled;
    
    // Log for debugging (only when enabled to reduce log spam)
    if (isEnabled) {
      console.log('[MaintenanceMode] ✅ Maintenance mode is ENABLED (from Redis)');
    }
    
    return isEnabled;
  } catch (error) {
    console.error('[MaintenanceMode] ❌ Error checking from Redis, using cache:', error);
    return maintenanceModeCache;
  }
}

/**
 * Set maintenance mode flag in Redis
 * Used by API routes to update the flag
 */
export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) {
      console.warn('[MaintenanceMode] Redis not available, flag not set');
      maintenanceModeCache = enabled;
      return;
    }
    
    const key = 'maintenance:mode';
    if (enabled) {
      // Set with explicit expiration (optional, but ensures it persists)
      await redis.set(key, 'on');
      console.info(`[MaintenanceMode] Set Redis key "${key}" = "on"`);
    } else {
      await redis.del(key);
      console.info(`[MaintenanceMode] Deleted Redis key "${key}"`);
    }
    
    // Verify the write
    const verify = await redis.get<string>(key);
    const isSet = verify === 'on';
    
    if (enabled && !isSet) {
      throw new Error(`Failed to set maintenance mode in Redis: expected "on", got "${verify}"`);
    }
    if (!enabled && isSet) {
      throw new Error(`Failed to disable maintenance mode in Redis: key still exists`);
    }
    
    // Update cache
    maintenanceModeCache = enabled;
    console.info(`[MaintenanceMode] ${enabled ? 'Enabled' : 'Disabled'} - verified in Redis`);
  } catch (error) {
    console.error('[MaintenanceMode] Error setting maintenance mode in Redis:', error);
    maintenanceModeCache = enabled;
    throw error; // Re-throw to ensure caller knows it failed
  }
}

