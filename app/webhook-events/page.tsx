'use client';

import { useState, useEffect } from 'react';

interface WebhookEvent {
  id: string;
  timestamp: string;
  payload: any;
  headers?: Record<string, string>;
  type?: string;
  messageId?: string;
  status?: string;
}

export default function WebhookEventsPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/webhook/events');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching webhook events:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearEvents = async () => {
    if (!confirm('Clear all webhook events?')) return;

    try {
      const response = await fetch('/api/webhook/events?clear=true');
      const data = await response.json();
      if (data.success) {
        setEvents([]);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Error clearing webhook events:', error);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    if (autoRefresh) {
      const interval = setInterval(fetchEvents, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Webhook Events Debug
            </h1>
            <p className="text-gray-600">
              Real-time webhook events from WSAPME (stored in memory for debugging)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {autoRefresh ? '⏸️ Auto-refresh ON' : '▶️ Auto-refresh OFF'}
            </button>
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              onClick={clearEvents}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <div className="flex gap-6">
            <div>
              <span className="text-sm text-gray-600">Total Events:</span>
              <span className="ml-2 text-lg font-bold text-gray-900">{events.length}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Last Updated:</span>
              <span className="ml-2 text-sm font-mono text-gray-700">
                {events.length > 0 ? new Date(events[0].timestamp).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No webhook events received yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Configure webhook URL in WSAPME: <code className="bg-gray-100 px-2 py-1 rounded">https://blast-wsapme.vercel.app/api/webhook/wsapme</code>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Events List */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Events ({events.length})</h2>
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-4 bg-white rounded-lg shadow cursor-pointer transition-all ${
                      selectedEvent?.id === event.id
                        ? 'ring-2 ring-blue-500 border-blue-500'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          {event.type && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {event.type}
                            </span>
                          )}
                          {event.status && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              event.status === 'DELIVERY_ACK' ? 'bg-green-100 text-green-800' :
                              event.status === 'READ_ACK' ? 'bg-blue-100 text-blue-800' :
                              event.status === 'SERVER_ACK' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.status}
                            </span>
                          )}
                        </div>
                        {event.messageId && (
                          <div className="mt-1 text-xs text-gray-600">
                            ID: <code className="bg-gray-100 px-1 rounded">{event.messageId}</code>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {Object.keys(event.payload).length} fields
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Event Details {selectedEvent ? `(${new Date(selectedEvent.timestamp).toLocaleString()})` : ''}
              </h2>
              {selectedEvent ? (
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Basic Info</h3>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-600">Type:</span> <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{selectedEvent.type || 'unknown'}</code></div>
                      {selectedEvent.status && (
                        <div><span className="text-gray-600">Status:</span> <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{selectedEvent.status}</code></div>
                      )}
                      {selectedEvent.messageId && (
                        <div><span className="text-gray-600">Message ID:</span> <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{selectedEvent.messageId}</code></div>
                      )}
                      <div><span className="text-gray-600">Timestamp:</span> <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{selectedEvent.timestamp}</code></div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Payload</h3>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                      {JSON.stringify(selectedEvent.payload, null, 2)}
                    </pre>
                  </div>

                  {selectedEvent.headers && Object.keys(selectedEvent.headers).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Headers</h3>
                      <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                        {JSON.stringify(selectedEvent.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">Select an event to view details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-6">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}

