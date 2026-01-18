import { NextResponse } from 'next/server';
import { getListDevices } from '@/lib/wsapme';

/**
 * Test endpoint to get device list from WSAPME API
 * GET /api/test-device-list
 * 
 * This endpoint does NOT require device to be online - it just retrieves device information
 * Can be used to test authentication and see device status
 */
export async function GET() {
  try {
    const result = await getListDevices();

    return NextResponse.json({
      success: true,
      data: result.data,
      endpoint: result.endpoint,
      message: 'Device list retrieved successfully',
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in test-device-list:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get device list',
        note: 'This endpoint may require different URL or request format. Check WSAPME documentation for the correct device list endpoint.',
      },
      { status: 500 }
    );
  }
}

