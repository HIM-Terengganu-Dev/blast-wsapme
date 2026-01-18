import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook endpoint for WSAPME status updates
 * POST /api/webhook/wsapme
 * 
 * This endpoint receives webhook notifications from WSAPME when:
 * - New messages are received
 * - Message status changes (SERVER_ACK, DELIVERY_ACK, READ_ACK)
 * 
 * Configure this URL in WSAPME dashboard:
 * - Device level: Settings → Webhook URL
 * - Account level: Account settings → Webhook URL
 * 
 * For testing: Use webhook.site or requestb.in
 * 
 * Documentation: https://api.wsapme.com/doc/start.php
 */
export async function POST(request: NextRequest) {
  const requestTime = new Date().toISOString();
  console.log(`\n[${requestTime}] ========== WSAPME WEBHOOK RECEIVED ==========`);

  try {
    // Parse webhook payload
    const payload = await request.json().catch(async () => {
      // If JSON parse fails, try form data
      const formData = await request.formData();
      const data: any = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      return data;
    });

    console.log('[WEBHOOK] Raw payload:', JSON.stringify(payload, null, 2));
    console.log('[WEBHOOK] Payload keys:', Object.keys(payload));
    console.log('[WEBHOOK] Payload values:', JSON.stringify(Object.values(payload), null, 2));

    // Log webhook type/event - check various possible fields
    const eventType = payload.type || payload.event || payload.eventType || payload.action || 'unknown';
    console.log('[WEBHOOK] Event type:', eventType);
    
    // Check for status-related fields
    const statusFields = {
      status: payload.status,
      messageStatus: payload.messageStatus,
      ack: payload.ack,
      acknowledgment: payload.acknowledgment,
      deliveryStatus: payload.deliveryStatus,
      readStatus: payload.readStatus,
      messageC2STimestamp: payload.messageC2STimestamp,
      messageId: payload.messageId || payload.id || payload.key?.id,
      timestamp: payload.timestamp,
    };
    console.log('[WEBHOOK] Status-related fields found:', JSON.stringify(statusFields, null, 2));

    // Handle different webhook event types
    if (payload.type === 'text' || payload.message) {
      // Incoming message webhook
      console.log('[WEBHOOK] Incoming message event');
      console.log('[WEBHOOK] From:', payload.from);
      console.log('[WEBHOOK] Message:', payload.message);
      
      // TODO: Handle incoming messages if needed
      
    } else if (payload.status || payload.ack || payload.messageStatus) {
      // Message status/ack event (DELIVERY_ACK, READ_ACK, etc.)
      console.log('[WEBHOOK] Message status event');
      console.log('[WEBHOOK] Status:', payload.status || payload.ack || payload.messageStatus);
      console.log('[WEBHOOK] Message ID:', payload.id || payload.messageId || payload.key?.id);
      
      // Extract status information
      const status = payload.status || payload.ack || payload.messageStatus;
      const messageId = payload.id || payload.messageId || payload.key?.id;
      const timestamp = payload.timestamp || payload.messageTimestamp || payload.messageC2STimestamp;
      
      console.log('[WEBHOOK] Status details:', {
        status,
        messageId,
        timestamp,
      });

      // TODO: Update database with status
      // When database is set up, update BlastRecipient status here
      // - Find recipient by messageId
      // - Update status (delivered, read)
      // - Update timestamps
      
    } else {
      // Unknown event type
      console.log('[WEBHOOK] Unknown event type:', JSON.stringify(payload, null, 2));
    }

    console.log(`[${new Date().toISOString()}] ========== WEBHOOK PROCESSED ==========\n`);

    // Return 200 to acknowledge receipt
    return NextResponse.json({
      success: true,
      message: 'Webhook received',
      receivedAt: new Date().toISOString(),
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ========== WEBHOOK ERROR ==========`);
    console.error('[WEBHOOK ERROR]', error.message);
    console.error('[WEBHOOK ERROR] Stack:', error.stack);
    
    // Still return 200 to prevent retries if error is our fault
    // Return 500 only if we want WSAPME to retry
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process webhook',
    }, { status: 200 }); // Return 200 to acknowledge receipt even on error
  }
}

/**
 * GET endpoint for webhook verification (if WSAPME requires it)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'WSAPME Webhook endpoint is active',
    endpoint: '/api/webhook/wsapme',
    method: 'POST',
    documentation: 'https://api.wsapme.com/doc/start.php',
  });
}

