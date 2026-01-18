/**
 * In-memory store for webhook events (for debugging purposes only)
 * This is temporary storage - events are lost on server restart
 */

interface WebhookEvent {
  id: string;
  timestamp: string;
  payload: any;
  headers?: Record<string, string>;
  type?: string;
  messageId?: string;
  status?: string;
}

// In-memory store (cleared on server restart)
const webhookEvents: WebhookEvent[] = [];
const MAX_EVENTS = 100; // Keep last 100 events

/**
 * Store a webhook event
 */
export function storeWebhookEvent(payload: any, headers?: Record<string, string>): void {
  const event: WebhookEvent = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    payload,
    headers,
    type: payload.type || payload.event || payload.eventType || (payload.status ? 'status_update' : 'unknown'),
    messageId: payload.id || payload.messageId || payload.key?.id || payload.data?.key?.id,
    status: payload.status || payload.ack || payload.messageStatus, // Can be "DELIVERY_ACK", "READ_ACK", "SERVER_ACK"
    messageC2STimestamp: payload.messageC2STimestamp || payload.messageTimestamp,
    remoteJid: payload.key?.remoteJid,
  };

  // Add to beginning of array
  webhookEvents.unshift(event);

  // Keep only last MAX_EVENTS
  if (webhookEvents.length > MAX_EVENTS) {
    webhookEvents.pop();
  }
}

/**
 * Get all stored webhook events
 */
export function getWebhookEvents(): WebhookEvent[] {
  return webhookEvents;
}

/**
 * Clear all stored events
 */
export function clearWebhookEvents(): void {
  webhookEvents.length = 0;
}

/**
 * Get events count
 */
export function getWebhookEventsCount(): number {
  return webhookEvents.length;
}

