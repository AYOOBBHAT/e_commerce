import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getSettings, updateSettings } from '@/lib/settings';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await getSettings();
    
    // Ensure maintenance mode is synced to Redis (in case it was changed directly in DB)
    const { initializeMaintenanceModeFromDB } = await import('@/lib/settings');
    await initializeMaintenanceModeFromDB();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.userId || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Update settings: saves to MongoDB (source of truth) and syncs to Redis (fast flag)
    const updatedSettings = await updateSettings(body);
    
    // Double-check: Verify maintenance mode is synced to Redis
    if (body.maintenanceMode !== undefined) {
      const { isMaintenanceMode, setMaintenanceMode } = await import('@/lib/maintenance-mode');
      const { getRedisClient } = await import('@/lib/redis');
      
      const redis = getRedisClient();
      if (!redis) {
        const hasEnvVars = !!(process.env.REDIS_URL && process.env.REDIS_REST_TOKEN);
        console.error('[Admin Settings] ⚠️ CRITICAL: Redis not configured! Maintenance mode will NOT work.');
        console.error('[Admin Settings] Environment check - REDIS_URL:', !!process.env.REDIS_URL, 'REDIS_REST_TOKEN:', !!process.env.REDIS_REST_TOKEN);
        
        // Still return success, but with a clear warning
        // Settings are saved to database, but maintenance mode won't work without Redis
        return NextResponse.json({ 
          success: true, 
          settings: updatedSettings,
          warning: 'Maintenance mode was saved to database, but it will NOT work because Redis is not configured.',
          instructions: hasEnvVars 
            ? 'Redis environment variables are set but connection failed. Check your Redis credentials and network connectivity.'
            : 'Please set REDIS_URL and REDIS_REST_TOKEN environment variables. Get them from https://console.upstash.com/',
          message: `Settings saved successfully. ${updatedSettings.maintenanceMode ? '⚠️ WARNING: Maintenance mode is enabled but will NOT work until Redis is configured!' : 'Maintenance mode disabled.'}`
        });
      }
      
      const redisValue = await isMaintenanceMode();
      console.log(`[Admin Settings] Maintenance mode update - DB: ${updatedSettings.maintenanceMode}, Redis: ${redisValue}`);
      
      // If mismatch, force sync again
      if (redisValue !== updatedSettings.maintenanceMode) {
        await setMaintenanceMode(updatedSettings.maintenanceMode);
        console.log(`[Admin Settings] Fixed Redis sync mismatch - now: ${updatedSettings.maintenanceMode}`);
      }
      
      // Final verification
      const finalCheck = await isMaintenanceMode();
      if (finalCheck !== updatedSettings.maintenanceMode) {
        console.error(`[Admin Settings] ❌ CRITICAL: Redis sync failed! DB: ${updatedSettings.maintenanceMode}, Redis: ${finalCheck}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to sync maintenance mode to Redis. Please check Redis configuration.',
          settings: updatedSettings
        }, { status: 500 });
      }
      
      console.log(`[Admin Settings] ✅ Maintenance mode successfully ${updatedSettings.maintenanceMode ? 'enabled' : 'disabled'}`);
    }

    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings,
      message: body.maintenanceMode !== undefined 
        ? `Maintenance mode ${updatedSettings.maintenanceMode ? 'enabled' : 'disabled'}` 
        : 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

