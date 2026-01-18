import { NextRequest, NextResponse } from 'next/server';
import { getDeviceInfo } from '@/lib/wsapme';

/**
 * Test endpoint to get device information
 * GET /api/test-device-info?deviceId=5850
 * 
 * This endpoint does NOT require device to be online - it just retrieves device information
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const deviceId = searchParams.get('deviceId') || '5850';

    console.log(`[${new Date().toISOString()}] ========== GET DEVICE INFO ==========`);
    console.log('[DEBUG] Device ID:', deviceId);

    const result = await getDeviceInfo(deviceId);

    return NextResponse.json({
      success: true,
      data: result.data,
      endpoint: result.endpoint,
      message: 'Device info retrieved successfully',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in test-device-info:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get device info',
      },
      { status: 500 }
    );
  }
}

