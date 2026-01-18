import { NextRequest, NextResponse } from 'next/server';
import { formatPhoneToJid } from '@/lib/wsapme';

/**
 * Test endpoint to try messageInfo with api.wsapme.com (v1 pattern)
 * POST /api/test-message-info-api-server
 * 
 * Tests different endpoint URLs for messageInfo
 */
export async function POST(request: NextRequest) {
  const requestTime = new Date().toISOString();
  console.log(`\n[${requestTime}] ========== TEST MESSAGEINFO API SERVER ==========`);
  
  try {
    const body = await request.json();
    const { messageId, messageTimestamp, messageData } = body;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'messageId is required' },
        { status: 400 }
      );
    }

    const token = process.env.WSAPME_USER_TOKEN;
    if (!token) {
      throw new Error('WSAPME_USER_TOKEN not set');
    }

    const phoneJid = formatPhoneToJid('+60189026292');
    const timestamp = messageTimestamp 
      ? (typeof messageTimestamp === 'string' ? parseInt(messageTimestamp, 10) : messageTimestamp)
      : Math.floor(Date.now() / 1000);

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
        messageTimestamp: timestamp,
        pushName: 'User',
        broadcast: false,
        status: 2,
        message: messageData?.message || {
          extendedTextMessage: {
            text: 'test',
          },
        },
      },
    };

    // Try different endpoint variations
    const endpointsToTry = [
      'https://api.wsapme.com/api/messageInfo',
      'https://api.wsapme.com/v1/messageInfo',
      'https://master.wsapme.com/api/messageInfo',
      'https://master.wsapme.com/v1/messageInfo',
    ];

    const results = [];

    for (const endpoint of endpointsToTry) {
      console.log(`\n[TEST] Trying endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'x-wsapme-token': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestPayload),
        });

        const responseText = await response.text();
        let data;
        
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          data = { rawResponse: responseText };
        }

        const result = {
          endpoint,
          status: response.status,
          success: data.success !== false && response.ok,
          data: data,
          hasStatus: !!data.status || !!data.data?.status,
          hasMessageC2STimestamp: !!data.messageC2STimestamp || !!data.data?.messageC2STimestamp,
        };

        console.log(`[TEST] Result for ${endpoint}:`, JSON.stringify(result, null, 2));
        results.push(result);

        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`[ERROR] ${endpoint} failed:`, error.message);
        results.push({
          endpoint,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`\n[${new Date().toISOString()}] ========== TEST COMPLETE ==========\n`);

    // Find which one worked
    const successful = results.filter(r => r.success && (r.hasStatus || r.hasMessageC2STimestamp));

    return NextResponse.json({
      success: true,
      messageId: messageId,
      results: results,
      summary: {
        total: results.length,
        successful: successful.length,
        workingEndpoints: successful.map(r => r.endpoint),
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ========== TEST ERROR ==========`);
    console.error('[ERROR]', error.message);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test messageInfo endpoints',
      },
      { status: 500 }
    );
  }
}

