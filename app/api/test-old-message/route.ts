import { NextRequest, NextResponse } from 'next/server';
import { getMessageInfo, formatPhoneToJid } from '@/lib/wsapme';

/**
 * Test endpoint to check status of an old message
 * POST /api/test-old-message
 * 
 * Body: {
 *   messageId: string,
 *   messageTimestamp?: number  // optional, will try to get from message if not provided
 * }
 */
export async function POST(request: NextRequest) {
  const requestTime = new Date().toISOString();
  console.log(`\n[${requestTime}] ========== TEST OLD MESSAGE STATUS ==========`);

  try {
    const body = await request.json();
    const { messageId, messageTimestamp } = body;

    console.log('[DEBUG] Testing message ID:', messageId);
    console.log('[DEBUG] Message timestamp provided:', messageTimestamp);

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'messageId is required',
        },
        { status: 400 }
      );
    }

    const phoneJid = formatPhoneToJid('+60189026292');
    const timestamp = messageTimestamp || 1768707796; // From the old message if known

    // Try different variations of the request to see what works
    const testVariations = [
      {
        name: 'Variation 1: Full structure with status as number',
        payload: {
          id_device: '5850',
          jid: phoneJid,
          messages: {
            key: {
              remoteJid: phoneJid,
              fromMe: true,
              id: messageId,
            },
            messageTimestamp: timestamp,
            pushName: 'User',
            broadcast: false,
            status: 2, // Try with status as number (from example)
            message: {
              extendedTextMessage: {
                text: 'Test message',
              },
            },
          },
        },
      },
      {
        name: 'Variation 2: Full structure without status field',
        payload: {
          id_device: '5850',
          jid: phoneJid,
          messages: {
            key: {
              remoteJid: phoneJid,
              fromMe: true,
              id: messageId,
            },
            messageTimestamp: timestamp,
            pushName: 'User',
            broadcast: false,
            message: {
              extendedTextMessage: {
                text: 'Test message',
              },
            },
          },
        },
      },
      {
        name: 'Variation 3: Minimal structure (key only)',
        payload: {
          id_device: '5850',
          jid: phoneJid,
          messages: {
            key: {
              remoteJid: phoneJid,
              fromMe: true,
              id: messageId,
            },
          },
        },
      },
      {
        name: 'Variation 4: With messageTimestamp only',
        payload: {
          id_device: '5850',
          jid: phoneJid,
          messages: {
            key: {
              remoteJid: phoneJid,
              fromMe: true,
              id: messageId,
            },
            messageTimestamp: timestamp,
          },
        },
      },
    ];

    const results = [];

    for (const variation of testVariations) {
      console.log(`\n[TEST] Trying: ${variation.name}`);
      console.log('[TEST] Payload:', JSON.stringify(variation.payload, null, 2));

      try {
        const result = await getMessageInfo(variation.payload as any);
        
        console.log(`[TEST] Result for ${variation.name}:`, JSON.stringify(result, null, 2));
        
        results.push({
          variation: variation.name,
          success: result.success,
          status: result.status,
          data: result.data,
          message: result.message,
        });

        // If one works, we can stop
        if (result.success && result.status !== undefined) {
          console.log(`\n[SUCCESS] Found working variation: ${variation.name}`);
          break;
        }
      } catch (error: any) {
        console.error(`[ERROR] ${variation.name} failed:`, error.message);
        results.push({
          variation: variation.name,
          success: false,
          error: error.message,
        });
      }

      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n[${new Date().toISOString()}] ========== TEST COMPLETE ==========\n`);

    return NextResponse.json({
      success: true,
      messageId: messageId,
      results: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success && r.status !== undefined).length,
        failed: results.filter(r => !r.success || r.status === undefined).length,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ========== TEST ERROR ==========`);
    console.error('[ERROR] Error:', error.message);
    console.error('[ERROR] Stack:', error.stack);
    console.error(`[${new Date().toISOString()}] ========== END ERROR ==========\n`);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test old message',
      },
      { status: 500 }
    );
  }
}

