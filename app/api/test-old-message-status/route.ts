import { NextRequest, NextResponse } from 'next/server';
import { formatPhoneToJid } from '@/lib/wsapme';

/**
 * Test endpoint to check status of old messages using /v1/messageInfo
 * POST /api/test-old-message-status
 * 
 * Body: {
 *   messageIds: string[]  // Array of old message IDs to test
 * }
 */
export async function POST(request: NextRequest) {
  const requestTime = new Date().toISOString();
  console.log(`\n[${requestTime}] ========== TEST OLD MESSAGE STATUS ==========`);
  
  try {
    const body = await request.json();
    const { messageIds } = body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'messageIds array is required' },
        { status: 400 }
      );
    }

    const token = process.env.WSAPME_USER_TOKEN;
    if (!token) {
      throw new Error('WSAPME_USER_TOKEN not set');
    }

    const phoneJid = formatPhoneToJid('+60189026292');

    // Try /v1/messageInfo endpoint
    const endpoint = 'https://api.wsapme.com/v1/messageInfo';

    const results = [];

    for (const messageId of messageIds) {
      console.log(`\n[TEST] Checking message ID: ${messageId}`);

      // Build request payload
      const requestPayload = {
        id_device: '5850',
        jid: phoneJid,
        messages: {
          key: {
            remoteJid: phoneJid,
            fromMe: true,
            id: messageId,
          },
          messageTimestamp: Math.floor(Date.now() / 1000), // Use current timestamp as fallback
          pushName: 'User',
          broadcast: false,
          status: 2, // Include status as in example
          message: {
            extendedTextMessage: {
              text: 'test message',
            },
          },
        },
      };

      try {
        console.log(`[TEST] Calling ${endpoint} for messageId: ${messageId}`);
        console.log(`[TEST] Payload:`, JSON.stringify(requestPayload, null, 2));

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'x-wsapme-token': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        });

        const responseText = await response.text();
        console.log(`[TEST] Response status:`, response.status, response.statusText);
        console.log(`[TEST] Raw response:`, responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          data = { rawResponse: responseText };
        }

        const result = {
          messageId,
          endpoint,
          status: response.status,
          success: data.success !== false && response.ok,
          data: data,
          hasStatus: !!data.status || !!data.data?.status || !!data.messages?.status,
          hasMessageC2STimestamp: !!data.messageC2STimestamp || !!data.data?.messageC2STimestamp,
          statusValue: data.status || data.data?.status || data.messages?.status,
          messageC2STimestamp: data.messageC2STimestamp || data.data?.messageC2STimestamp,
        };

        console.log(`[TEST] Result for ${messageId}:`, JSON.stringify(result, null, 2));
        results.push(result);

        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`[ERROR] ${messageId} failed:`, error.message);
        results.push({
          messageId,
          endpoint,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`\n[${new Date().toISOString()}] ========== TEST COMPLETE ==========\n`);

    // Find which ones worked
    const successful = results.filter(r => r.success && (r.hasStatus || r.hasMessageC2STimestamp));

    return NextResponse.json({
      success: true,
      endpoint: endpoint,
      totalTested: results.length,
      successful: successful.length,
      results: results,
      workingMessageIds: successful.map(r => r.messageId),
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ========== TEST ERROR ==========`);
    console.error('[ERROR]', error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test old message status',
      },
      { status: 500 }
    );
  }
}

