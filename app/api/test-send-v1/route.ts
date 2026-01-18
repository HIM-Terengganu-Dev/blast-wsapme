import { NextRequest, NextResponse } from 'next/server';

/**
 * Get WSAPME user token from environment
 */
function getToken(): string {
  const token = process.env.WSAPME_USER_TOKEN;
  if (!token) {
    throw new Error(
      'WSAPME_USER_TOKEN is not set in environment variables. Please check your .env file.'
    );
  }
  return token;
}

/**
 * Test endpoint to send message via /v1/sendMessage (without "2")
 * POST /api/test-send-v1
 * 
 * Body: {
 *   message?: string  // optional, defaults to test message
 * }
 * 
 * Tests the format with redirect_url parameter
 */
export async function POST(request: NextRequest) {
  const requestTime = new Date().toISOString();
  console.log(`\n[${requestTime}] ========== TEST SEND MESSAGE V1 ==========`);

  try {
    const body = await request.json().catch(() => ({}));
    const testMessage = body.message || 'This is a test message from Marketing Blast Tracker';

    console.log('[DEBUG] Request body:', JSON.stringify(body, null, 2));
    console.log('[DEBUG] Test message:', testMessage);

    const token = getToken();
    const endpoint = 'https://api.wsapme.com/v1/sendMessage';
    const webhookUrl = 'https://blast-wsapme.vercel.app/api/webhook/wsapme';

    const sendPayload = {
      device: '5850',
      to: '+60189026292',
      message: testMessage,
      redirect_url: webhookUrl,
    };

    console.log('[DEBUG] Testing /v1/sendMessage (without "2")');
    console.log('[DEBUG] Endpoint:', endpoint);
    console.log('[DEBUG] Request payload:', JSON.stringify(sendPayload, null, 2));
    console.log('[DEBUG] Webhook URL:', webhookUrl);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-wsapme-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendPayload),
    });

    console.log('[DEBUG] Response status:', response.status, response.statusText);
    console.log('[DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('[DEBUG] Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[DEBUG] Failed to parse JSON response:', parseError);
      throw new Error(`Invalid JSON response from WSAPME: ${responseText.substring(0, 200)}`);
    }

    console.log('[DEBUG] Parsed response data:', JSON.stringify(data, null, 2));

    // Extract message ID
    const messageId = data.messageId || data.id || data.data?.id || data.data?.messageId || 
                     data.data?.key?.id || data.key?.id;

    console.log('[DEBUG] Message ID extracted:', messageId);
    console.log(`[${new Date().toISOString()}] ========== TEST COMPLETE ==========\n`);

    return NextResponse.json({
      success: data.success !== false && response.ok,
      data: data.data || data,
      messageId: messageId,
      messageData: data.data || data,
      exactStructure: data.data || data,
      endpoint: endpoint,
      redirect_url: webhookUrl,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ========== TEST ERROR ==========`);
    console.error('[ERROR] Error type:', error.constructor.name);
    console.error('[ERROR] Error message:', error.message);
    console.error('[ERROR] Error stack:', error.stack);
    console.error(`[${new Date().toISOString()}] ========== END ERROR ==========\n`);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send message via /v1/sendMessage',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

