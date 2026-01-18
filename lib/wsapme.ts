import type {
  WSAPMESendMessageRequest,
  WSAPMESendMessageResponse,
  WSAPMEMessageInfoRequest,
  WSAPMEMessageInfoResponse,
} from '@/types';

const WSAPME_API_BASE = 'https://api.wsapme.com';
const WSAPME_MASTER_BASE = 'https://master.wsapme.com';

// Safety: Allowed phone number for testing
const ALLOWED_PHONE_NUMBER = '60189026292';
const ALLOWED_PHONE_NUMBER_WITH_PLUS = '+60189026292';

/**
 * Validates that phone number matches the allowed test number
 * This prevents accidental sends to other numbers or groups
 */
function validatePhoneNumber(phone: string): void {
  const normalized = phone.replace(/[+\s-]/g, '');
  const allowedNormalized = ALLOWED_PHONE_NUMBER.replace(/[+\s-]/g, '');

  if (normalized !== allowedNormalized) {
    throw new Error(
      `Safety check failed: Phone number must be ${ALLOWED_PHONE_NUMBER} or ${ALLOWED_PHONE_NUMBER_WITH_PLUS}. Provided: ${phone}`
    );
  }
}

/**
 * Get WSAPME user token from environment
 */
function getToken(): string {
  const token = process.env.WSAPME_USER_TOKEN;
  if (!token) {
    throw new Error('WSAPME_USER_TOKEN is not set in environment variables');
  }
  return token;
}

/**
 * Send a WhatsApp message via WSAPME API
 * 
 * @param request - Message send request
 * @returns Response with message ID for tracking
 */
export async function sendMessage(
  request: WSAPMESendMessageRequest
): Promise<WSAPMESendMessageResponse> {
  // Safety validation: Only allow sending to the test phone number
  validatePhoneNumber(request.to);

  const token = getToken();
  const endpoint = `${WSAPME_API_BASE}/v1/sendMessage2`;

  console.log('[WSAPME API] Calling sendMessage endpoint:', endpoint);
  console.log('[WSAPME API] Request payload:', JSON.stringify(request, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-wsapme-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('[WSAPME API] Response status:', response.status, response.statusText);
    console.log('[WSAPME API] Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('[WSAPME API] Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[WSAPME API] Failed to parse JSON response:', parseError);
      // Even if JSON parse fails, message might have been sent
      // Check if response contains success indicators
      if (response.ok || responseText.includes('success') || responseText.includes('sent')) {
        console.log('[WSAPME API] Response appears successful despite parse error');
        return {
          success: true,
          message: 'Message may have been sent (response format unexpected)',
          data: { rawResponse: responseText },
          messageId: extractMessageIdFromText(responseText),
        };
      }
      throw new Error(`Invalid JSON response from WSAPME: ${responseText.substring(0, 200)}`);
    }

    console.log('[WSAPME API] Parsed response data:', JSON.stringify(data, null, 2));

    // Extract message ID from various possible locations
    const messageId = data.messageId || data.id || data.data?.id || data.data?.messageId || 
                     data.message?.id || extractMessageIdFromText(JSON.stringify(data));

    console.log('[WSAPME API] Extracted messageId:', messageId);

    const result = {
      success: data.success !== false && (response.ok || data.success === true),
      message: data.message,
      data: data.data || data,
      messageId: messageId,
    };

    console.log('[WSAPME API] Returning result:', JSON.stringify(result, null, 2));

    return result;
  } catch (error: any) {
    console.error('[WSAPME API] Error in sendMessage:', error);
    console.error('[WSAPME API] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Helper to extract message ID from text response
 */
function extractMessageIdFromText(text: string): string | undefined {
  // Try to find message ID patterns in text
  const patterns = [
    /"id":\s*"([^"]+)"/,
    /"messageId":\s*"([^"]+)"/,
    /message[_-]?id["\s:=]+([a-zA-Z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Get message information/status from WSAPME API
 * 
 * @param request - Message info request
 * @returns Message status and details
 */
export async function getMessageInfo(
  request: WSAPMEMessageInfoRequest
): Promise<WSAPMEMessageInfoResponse> {
  const token = getToken();
  const endpoint = `${WSAPME_MASTER_BASE}/api/messageInfo`;

  console.log('[WSAPME API] Calling messageInfo endpoint:', endpoint);
  console.log('[WSAPME API] Request payload:', JSON.stringify(request, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-wsapme-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('[WSAPME API] Response status:', response.status, response.statusText);
    console.log('[WSAPME API] Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('[WSAPME API] Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[WSAPME API] Failed to parse JSON response:', parseError);
      throw new Error(`Invalid JSON response from WSAPME: ${responseText.substring(0, 200)}`);
    }

    console.log('[WSAPME API] Parsed response data:', JSON.stringify(data, null, 2));

    // Look for status in various locations
    // Status can be "DELIVERY_ACK", "READ_ACK", "PENDING", etc. (strings, not numbers)
    // Also check messages.status if nested
    const status = data.status || 
                   data.data?.status || 
                   data.messages?.status || 
                   data.data?.messages?.status ||
                   data.data?.messages?.key?.status;

    // Look for messageC2STimestamp (indicates message was received by recipient)
    // This is the key field to check for delivery confirmation
    const messageC2STimestamp = data.messageC2STimestamp || 
                                data.data?.messageC2STimestamp || 
                                data.messages?.messageC2STimestamp ||
                                data.data?.messages?.messageC2STimestamp;

    console.log('[WSAPME API] Extracted status:', status, '(Type:', typeof status, ')');
    console.log('[WSAPME API] Extracted messageC2STimestamp:', messageC2STimestamp);
    
    // Check if status indicates delivery (DELIVERY_ACK means message was received)
    const isDelivered = status === 'DELIVERY_ACK' || status === 'READ_ACK' || !!messageC2STimestamp;
    console.log('[WSAPME API] Message delivered?', isDelivered);

    const result = {
      success: data.success || isDelivered, // Success if status shows delivery or if explicitly true
      status: status,
      messageC2STimestamp: messageC2STimestamp,
      isDelivered: isDelivered,
      data: data.data || data,
      ...data,
    };

    console.log('[WSAPME API] Returning result:', JSON.stringify(result, null, 2));

    return result;
  } catch (error: any) {
    console.error('[WSAPME API] Error in getMessageInfo:', error);
    console.error('[WSAPME API] Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Get list of all devices associated with the user token
 * This endpoint can be tested without device being online
 * 
 * Endpoint: GET https://api.wsapme.com/v1/devices
 * 
 * @returns List of devices with their status information
 */
export async function getListDevices(): Promise<any> {
  const token = getToken();

  try {
    const endpoint = `${WSAPME_API_BASE}/v1/devices`;
    
    console.log('[WSAPME API] Calling getListDevices endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-wsapme-token': token,
        'Content-Type': 'application/json',
      },
    });

    console.log('[WSAPME API] Device list response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[WSAPME API] Device list data:', JSON.stringify(data, null, 2));

    return {
      success: data.success || response.ok,
      data: data.data || data,
      endpoint: endpoint,
    };
  } catch (error) {
    console.error('Error getting device list from WSAPME:', error);
    throw error;
  }
}

/**
 * Get device information by device ID
 * Endpoint: POST https://api.wsapme.com/v1/info
 * 
 * @param deviceId - Device ID (e.g., "5850")
 * @returns Device information
 */
export async function getDeviceInfo(deviceId: string): Promise<any> {
  const token = getToken();

  try {
    const endpoint = `${WSAPME_API_BASE}/v1/info`;
    
    console.log('[WSAPME API] Calling getDeviceInfo endpoint:', endpoint);
    console.log('[WSAPME API] Device ID:', deviceId);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-wsapme-token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device: deviceId,
      }),
    });

    console.log('[WSAPME API] Device info response status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('[WSAPME API] Device info raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[WSAPME API] Failed to parse JSON response:', parseError);
      throw new Error(`Invalid JSON response from WSAPME: ${responseText.substring(0, 200)}`);
    }

    console.log('[WSAPME API] Device info parsed data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      success: data.success || response.ok,
      data: data.data || data,
      endpoint: endpoint,
    };
  } catch (error) {
    console.error('Error getting device info from WSAPME:', error);
    throw error;
  }
}

/**
 * Helper function to format phone number to JID format
 * @param phone - Phone number (e.g., "60189026292" or "+60189026292")
 * @returns WhatsApp JID format (e.g., "60189026292@s.whatsapp.net")
 */
export function formatPhoneToJid(phone: string): string {
  const normalized = phone.replace(/[+\s-]/g, '');
  return `${normalized}@s.whatsapp.net`;
}

