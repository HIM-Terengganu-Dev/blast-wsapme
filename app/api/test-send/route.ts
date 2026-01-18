import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/wsapme';

/**
 * Test endpoint to send a message via WSAPME API
 * POST /api/test-send
 * 
 * Body: {
 *   message?: string,  // optional, defaults to test message
 *   to: string         // required, phone number to send to (e.g., "+60123456789")
 * }
 */
export async function POST(request: NextRequest) {
  const requestTime = new Date().toISOString();
  console.log(`\n[${requestTime}] ========== SEND MESSAGE START ==========`);

  try {
    const body = await request.json().catch(() => ({}));
    const testMessage = body.message || 'This is an automated message for testing. Do ignore this!';
    const to = body.to;

    if (!to || !to.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone number (to) is required',
        },
        { status: 400 }
      );
    }

    console.log('[DEBUG] Request body:', JSON.stringify(body, null, 2));
    console.log('[DEBUG] Test message:', testMessage);
    console.log('[DEBUG] Recipient phone:', to);

    const sendPayload = {
      device: '5850',
      to: to.trim(),
      message: testMessage,
    };

    console.log('[DEBUG] Sending message with payload:', JSON.stringify(sendPayload, null, 2));

    // Send test message to the allowed phone number only
    const result = await sendMessage(sendPayload);

    console.log('[DEBUG] Send message result:', JSON.stringify(result, null, 2));
    console.log('[DEBUG] Message ID extracted:', result.messageId);

    // Check if message was actually sent (even if response format is unexpected)
    // Store full message data for status checking (messageInfo needs complete message object)
    const messageId = result.messageId || result.data?.id || result.data?.messageId;
    
    // EXACT MESSAGE STRUCTURE - Log this for future status checks
    const exactMessageStructure = result.data || result;
    console.log('\n[EXACT MESSAGE STRUCTURE] ========================================');
    console.log('[EXACT MESSAGE STRUCTURE] This is the EXACT structure returned from send:');
    console.log(JSON.stringify(exactMessageStructure, null, 2));
    console.log('[EXACT MESSAGE STRUCTURE] ========================================\n');
    
    const response = {
      success: true,
      data: result,
      messageId: messageId,
      // Store full message data for status checking
      messageData: exactMessageStructure, // This contains the full message structure needed for messageInfo
      // Store exact structure for debugging/reference
      exactStructure: exactMessageStructure,
    };

    console.log('[DEBUG] Final response:', JSON.stringify(response, null, 2));
    console.log(`[${new Date().toISOString()}] ========== SEND MESSAGE SUCCESS ==========\n`);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ========== SEND MESSAGE ERROR ==========`);
    console.error('[ERROR] Error type:', error.constructor.name);
    console.error('[ERROR] Error message:', error.message);
    console.error('[ERROR] Error stack:', error.stack);
    console.error('[ERROR] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error(`[${new Date().toISOString()}] ========== END ERROR ==========\n`);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send message',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

