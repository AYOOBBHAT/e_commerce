import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

/**
 * Public API endpoint to get payment methods visibility
 * This endpoint is accessible without authentication
 */
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      paymentMethods: settings.paymentMethods || {
        phonepe: true,
        razorpay: true,
        cashfree: true,
        cod: true,
      },
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    // Return default enabled methods on error
    return NextResponse.json({
      paymentMethods: {
        phonepe: true,
        razorpay: true,
        cashfree: true,
        cod: true,
      },
    });
  }
}

