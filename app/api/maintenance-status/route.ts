// Lightweight API endpoint for middleware to check maintenance mode
// This can be called from middleware as a fallback if Redis is not available
import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

export async function GET() {
  try {
    // This endpoint is fast and can be called from middleware
    // It reads directly from MongoDB (slower than Redis but works as fallback)
    const settings = await getSettings();
    return NextResponse.json({ 
      maintenanceMode: settings.maintenanceMode,
      source: 'database'
    });
  } catch (error) {
    console.error('[MaintenanceStatus] Error:', error);
    return NextResponse.json(
      { maintenanceMode: false, error: String(error) },
      { status: 500 }
    );
  }
}

