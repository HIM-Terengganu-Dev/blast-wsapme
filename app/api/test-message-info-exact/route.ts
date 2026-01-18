import { NextRequest, NextResponse } from 'next/server';
import { getMessageInfo, formatPhoneToJid } from '@/lib/wsapme';

/**
 * Test endpoint using EXACT format from documentation
 * POST /api/test-message-info-exact
 * 
 * This tries to match the exact request format from WSAPME docs
 */
export async function POST(request: NextRequest) {
  const requestTime = new Date().toISOString();
  console.log(`\n[${requestTime}] ========== TEST EXACT DOCUMENTATION FORMAT ==========`);
  
  try {
    const body = await request.json();
    const { messageId, messageTimestamp, messageData } = body;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'messageId is required' },
        { status: 400 }
      );
    }

    const phoneJid = formatPhoneToJid('+60189026292');
    
    // Convert timestamp to number
    const timestamp = messageTimestamp 
      ? (typeof messageTimestamp === 'string' ? parseInt(messageTimestamp, 10) : messageTimestamp)
      : Math.floor(Date.now() / 1000);

    // Build EXACT format from documentation example
    // Key differences from our current approach:
    // 1. Includes status: 2 (number) in messages object
    // 2. Has full messageContextInfo structure (if available from send response)
    const exactFormat = {
      id_device: "5850",
      jid: phoneJid,
      messages: {
        key: {
          remoteJid: phoneJid,
          fromMe: true,
          id: messageId,
        },
        messageTimestamp: timestamp,
        pushName: "User",
        broadcast: false,
        status: 2, // Include status: 2 as shown in documentation example
        message: messageData?.message || {
          extendedTextMessage: {
            text: "test message",
          },
        },
      },
    };

    // If we have messageContextInfo from send response, include it
    if (messageData?.message?.messageContextInfo) {
      exactFormat.messages.message.messageContextInfo = messageData.message.messageContextInfo;
    }

    console.log('[DEBUG] Exact format request (matching documentation):');
    console.log(JSON.stringify(exactFormat, null, 2));

    const result = await getMessageInfo(exactFormat as any);

    console.log('[DEBUG] Response:', JSON.stringify(result, null, 2));
    console.log(`[${new Date().toISOString()}] ========== TEST COMPLETE ==========\n`);

    return NextResponse.json({
      success: result.success,
      data: result.data,
      status: result.status,
      messageC2STimestamp: result.messageC2STimestamp,
      isDelivered: result.isDelivered,
      rawResponse: result,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ========== TEST ERROR ==========`);
    console.error('[ERROR]', error.message);
    console.error(`[${new Date().toISOString()}] ========== END ERROR ==========\n`);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test exact format',
      },
      { status: 500 }
    );
  }
}

