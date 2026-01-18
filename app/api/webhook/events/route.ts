import { NextRequest, NextResponse } from 'next/server';
import { getWebhookEvents, clearWebhookEvents } from '@/lib/webhook-store';

/**
 * Get webhook events (for debugging UI)
 * GET /api/webhook/events
 * 
 * Query params:
 *   - clear: if true, clears all events before returning
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const shouldClear = searchParams.get('clear') === 'true';

    if (shouldClear) {
      clearWebhookEvents();
      return NextResponse.json({
        success: true,
        message: 'Webhook events cleared',
        events: [],
      });
    }

    const events = getWebhookEvents();

    return NextResponse.json({
      success: true,
      count: events.length,
      events,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error getting webhook events:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get webhook events',
      },
      { status: 500 }
    );
  }
}

