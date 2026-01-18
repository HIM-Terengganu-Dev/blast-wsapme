import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/wsapme';
import { formatPhoneToJid } from '@/lib/wsapme';

/**
 * Test endpoint: Send message via v2, then check status using master.wsapme.com/api/messageInfo
 * POST /api/test-send-then-status
 * 
 * Body: {
 *   to: string,         // required, phone number to send to (e.g., "+60123456789")
 *   message?: string    // optional, message text
 * }
 * 
 * This generates clean API logs for WSAPME developer debugging
 */
export async function POST(request: NextRequest) {
  console.log('\n' + '='.repeat(80));
  console.log('[WSAPME API LOGS FOR DEVELOPER] - Send Message v2 then Check Status');
  console.log('='.repeat(80) + '\n');

  try {
    const token = process.env.WSAPME_USER_TOKEN;
    if (!token) {
      throw new Error('WSAPME_USER_TOKEN not set');
    }

    // Parse request body first
    const body = await request.json().catch(() => ({}));
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

    // =================================================================
    // STEP 1: Send Message via v1/sendMessage2
    // =================================================================
    console.log('[STEP 1] ========== SEND MESSAGE VIA v1/sendMessage2 ==========');
    
    const sendPayload = {
      device: '5850',
      to: to.trim(),
      message: body.message || 'Test message for status check - ' + new Date().toISOString(),
    };

    console.log('[REQUEST] POST https://api.wsapme.com/v1/sendMessage2');
    console.log('[HEADERS]');
    console.log('  x-wsapme-token: ' + token);
    console.log('  Content-Type: application/json');
    console.log('[BODY]');
    console.log(JSON.stringify(sendPayload, null, 2));

    const sendEndpoint = 'https://api.wsapme.com/v1/sendMessage2';
    const sendResponse = await fetch(sendEndpoint, {
      method: 'POST',
      headers: {
        'x-wsapme-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendPayload),
    });

    const sendResponseText = await sendResponse.text();
    console.log('[RESPONSE] HTTP ' + sendResponse.status + ' ' + sendResponse.statusText);
    console.log('[RESPONSE BODY]');
    console.log(sendResponseText);

    let sendData;
    try {
      sendData = JSON.parse(sendResponseText);
    } catch (parseError) {
      throw new Error(`Failed to parse send response: ${sendResponseText.substring(0, 200)}`);
    }

    // Extract messageId and full message data
    const messageId = sendData.messageId || sendData.data?.key?.id || sendData.data?.id;
    const messageData = sendData.data || sendData;

    if (!messageId) {
      throw new Error('Message ID not found in send response');
    }

    console.log('[EXTRACTED] messageId: ' + messageId);
    console.log('[STEP 1 COMPLETE]\n');

    // Wait a bit before checking status
    console.log('[WAIT] Waiting 3 seconds before status check...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // =================================================================
    // STEP 2: Check Status via /v1/getMessageStatus
    // =================================================================
    console.log('[STEP 2] ========== CHECK STATUS VIA /v1/getMessageStatus ==========');
    
    const phoneJid = formatPhoneToJid(to.trim());
    
    // Use messageTimestamp from send response, or current time
    const messageTimestamp = messageData.messageTimestamp 
      ? (typeof messageData.messageTimestamp === 'string' 
          ? parseInt(messageData.messageTimestamp, 10) 
          : messageData.messageTimestamp)
      : Math.floor(Date.now() / 1000);

    // Build request using new format: device and messageId
    const statusPayload = {
      device: '5850',
      messageId: messageId, // Use messageId from send response
    };

    console.log('[REQUEST] POST https://api.wsapme.com/v1/getMessageStatus');
    console.log('[HEADERS]');
    console.log('  x-wsapme-token: ' + token);
    console.log('  Content-Type: application/json');
    console.log('[BODY]');
    console.log(JSON.stringify(statusPayload, null, 2));

    const statusEndpoint = 'https://api.wsapme.com/v1/getMessageStatus';
    const statusResponse = await fetch(statusEndpoint, {
      method: 'POST',
      headers: {
        'x-wsapme-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusPayload),
    });

    const statusResponseText = await statusResponse.text();
    console.log('[RESPONSE] HTTP ' + statusResponse.status + ' ' + statusResponse.statusText);
    console.log('[RESPONSE BODY]');
    console.log(statusResponseText);

    let statusData;
    try {
      statusData = JSON.parse(statusResponseText);
    } catch (parseError) {
      statusData = { rawResponse: statusResponseText };
    }

    console.log('[STEP 2 COMPLETE]\n');
    console.log('='.repeat(80));
    console.log('[END API LOGS]');
    console.log('='.repeat(80) + '\n');

    return NextResponse.json({
      success: true,
      sendMessage: {
        endpoint: sendEndpoint,
        messageId: messageId,
        response: sendData,
      },
      messageInfo: {
        endpoint: statusEndpoint,
        requestPayload: statusPayload,
        response: statusData,
        hasStatus: !!statusData.status || !!statusData.data?.status,
        hasMessageC2STimestamp: !!statusData.messageC2STimestamp || !!statusData.data?.messageC2STimestamp,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error('[ERROR] ' + error.message);
    console.error('[ERROR STACK] ' + error.stack);
    console.log('='.repeat(80) + '\n');

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test send then status',
      },
      { status: 500 }
    );
  }
}

