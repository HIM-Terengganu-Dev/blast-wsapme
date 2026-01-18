import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock test endpoint that simulates WSAPME API responses
 * Can be used for frontend testing without device being online
 * 
 * GET /api/test-mock?type=send|status|blast
 * 
 * Query Parameters:
 * - type: "send" | "status" | "blast" (default: "blast")
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'blast';

    switch (type) {
      case 'send':
        // Mock send message response
        return NextResponse.json({
          success: true,
          data: {
            messageId: `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'sent',
            timestamp: Date.now(),
          },
          messageId: `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }, { status: 200 });

      case 'status':
        // Mock message status response
        return NextResponse.json({
          success: true,
          status: 2, // Mock status code (will need actual mapping later)
          data: {
            messages: {
              key: {
                id: 'MOCK_MESSAGE_ID',
                remoteJid: '60189026292@s.whatsapp.net',
                fromMe: true,
              },
              status: 2,
              messageTimestamp: Date.now() - 60000, // 1 minute ago
              pushName: 'Test Recipient',
            },
          },
        }, { status: 200 });

      case 'blast':
      default:
        // Mock blast metrics response
        return NextResponse.json({
          success: true,
          data: {
            sent: 500,
            received: 480,
            read: 350,
            replied: 120,
            closed: 25,
          },
        }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error in test-mock:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get mock data',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-mock
 * Simulates POST endpoints for testing
 * 
 * Body: { "type": "send" | "status", ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type } = body;

    switch (type) {
      case 'send':
        // Mock send message response
        return NextResponse.json({
          success: true,
          data: {
            messageId: `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'sent',
            timestamp: Date.now(),
          },
          messageId: `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }, { status: 200 });

      case 'status':
        // Mock message status response
        const { messageId } = body;
        return NextResponse.json({
          success: true,
          status: 2, // Mock status code
          data: {
            messages: {
              key: {
                id: messageId || 'MOCK_MESSAGE_ID',
                remoteJid: '60189026292@s.whatsapp.net',
                fromMe: true,
              },
              status: 2,
              messageTimestamp: Date.now() - 60000,
              pushName: 'Test Recipient',
            },
          },
        }, { status: 200 });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type. Use "send" or "status"',
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in test-mock:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process mock request',
      },
      { status: 500 }
    );
  }
}

