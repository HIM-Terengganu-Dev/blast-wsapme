import { NextRequest, NextResponse } from 'next/server';
import { getMessageInfo, formatPhoneToJid } from '@/lib/wsapme';

/**
 * Test endpoint to get message info/status from WSAPME API
 * POST /api/test-message-info
 * 
 * Body: {
 *   messageId: string,
 *   to?: string,      // optional, phone number (e.g., "+60123456789")
 *   jid?: string,     // optional, WhatsApp JID format
 *   messageData?: object  // optional, full message data from send response
 * }
 */
export async function POST(request: NextRequest) {
  const requestTime = new Date().toISOString();
  console.log(`\n[${requestTime}] ========== MESSAGE STATUS CHECK START ==========`);
  
  try {
    const body = await request.json();
    const { messageId, jid, messageData, to } = body;

    console.log('[DEBUG] Received request body:', JSON.stringify(body, null, 2));

    if (!messageId) {
      console.error('[ERROR] messageId is missing in request');
      return NextResponse.json(
        {
          success: false,
          error: 'messageId is required',
        },
        { status: 400 }
      );
    }

    // Determine JID: use provided jid, or extract from messageData, or format from 'to' parameter, or use messageData.remoteJid
    let phoneJid: string;
    if (jid) {
      phoneJid = jid;
    } else if (messageData?.key?.remoteJid) {
      // Use the recipient JID from the message data (where message was sent to)
      phoneJid = messageData.key.remoteJid;
    } else if (to) {
      phoneJid = formatPhoneToJid(to);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone number (to) or JID is required. Provide either "to" parameter or "messageData" with recipient information.',
        },
        { status: 400 }
      );
    }
    
    console.log('[DEBUG] Using JID:', phoneJid);
    console.log('[DEBUG] Message ID:', messageId);

    // Build the complete messages object as required by messageInfo endpoint
    // If messageData is provided (from send response), use it; otherwise build minimal structure
    let messagesObject;
    
    if (messageData && messageData.key && messageData.message) {
      // Convert messageTimestamp from string to number if needed (example shows it as number)
      const timestamp = messageData.messageTimestamp 
        ? (typeof messageData.messageTimestamp === 'string' 
            ? parseInt(messageData.messageTimestamp, 10) 
            : messageData.messageTimestamp)
        : Math.floor(Date.now() / 1000);
      
      // Use the full message data from send response
      // Build messages object matching the example format exactly
      // Note: Include status in request if it's a number (example shows status: 2)
      // But the response will have status as string like "DELIVERY_ACK"
      messagesObject = {
        key: messageData.key,
        messageTimestamp: timestamp, // Must be number
        pushName: messageData.pushName || 'User',
        broadcast: messageData.broadcast || false,
        // Documentation example shows status: 2 (number) in request
        // Try including it even if we don't have it from send response
        status: (messageData.status && typeof messageData.status === 'number') 
          ? messageData.status 
          : 2, // Default to 2 as shown in documentation example
        message: messageData.message,
      };
      console.log('[DEBUG] Using full message data from send response');
      console.log('[DEBUG] Converted timestamp to number:', timestamp);
      console.log('[DEBUG] Status field included:', messageData.status && typeof messageData.status === 'number' ? messageData.status : 'No (PENDING or not a number)');
    } else {
      // Fallback: build minimal structure (may not work, but better than nothing)
      messagesObject = {
        key: {
          remoteJid: phoneJid,
          fromMe: true,
          id: messageId,
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'User',
        broadcast: false,
      };
      console.warn('[WARNING] Full message data not provided, using minimal structure');
    }

    const requestPayload = {
      id_device: '5850',
      jid: phoneJid,
      messages: messagesObject,
    };

    console.log('[DEBUG] Request payload to WSAPME:', JSON.stringify(requestPayload, null, 2));

    const result = await getMessageInfo(requestPayload);

    console.log('[DEBUG] WSAPME API Response:', JSON.stringify(result, null, 2));
    console.log(`[${new Date().toISOString()}] ========== MESSAGE STATUS CHECK SUCCESS ==========\n`);

    // Check for DELIVERY_ACK status and messageC2STimestamp in response
    // Status should be "DELIVERY_ACK" (string) when message is received
    const deliveryStatus = result.data?.status || result.status || result.data?.messages?.status;
    const messageC2STimestamp = result.data?.messageC2STimestamp || result.messageC2STimestamp || result.data?.messages?.messageC2STimestamp;

    console.log('[DEBUG] Delivery status found:', deliveryStatus);
    console.log('[DEBUG] messageC2STimestamp found:', messageC2STimestamp);

    return NextResponse.json({
      success: result.success !== false, // Treat as success if not explicitly false
      data: result.data || result,
      status: deliveryStatus, // This will be "DELIVERY_ACK" or other status strings
      messageC2STimestamp: messageC2STimestamp,
      // Include full response for debugging
      rawResponse: result,
    }, { status: 200 });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ========== MESSAGE STATUS CHECK ERROR ==========`);
    console.error('[ERROR] Error type:', error.constructor.name);
    console.error('[ERROR] Error message:', error.message);
    console.error('[ERROR] Error stack:', error.stack);
    console.error('[ERROR] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error(`[${new Date().toISOString()}] ========== END ERROR ==========\n`);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get message info',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

