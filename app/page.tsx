'use client';

import { useEffect, useState } from 'react';
import FunnelChart from '@/components/FunnelChart';
import type { BlastMetrics } from '@/types';

export default function Home() {
  const [metrics, setMetrics] = useState<BlastMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [messageStatus, setMessageStatus] = useState<any>(null);
  const [deviceList, setDeviceList] = useState<any>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [statusHistory, setStatusHistory] = useState<Array<{time: Date, status: number, data: any}>>([]);
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>('+60107756410');

  useEffect(() => {
    async function fetchBlastData() {
      try {
        setLoading(true);
        const response = await fetch('/api/blast-data');
        const data = await response.json();

        if (data.success && data.data) {
          setMetrics(data.data);
        } else {
          setError(data.error || 'Failed to fetch blast data');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching data');
        console.error('Error fetching blast data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBlastData();
    fetchDeviceList();
  }, []);

  // Helper function to get status label (will be updated once we know status code meanings)
  function getStatusLabel(status: number): string {
    // TODO: Update these labels based on actual WSAPME status codes
    const statusMap: Record<number, string> = {
      0: 'Pending/Sent',
      1: 'Delivered/Received',
      2: 'Read',
      3: 'Replied',
      4: 'Error',
    };
    return statusMap[status] || `Unknown (${status})`;
  }

  // Status Indicator Component
  function StatusIndicator({ label, reached }: { label: string; reached: boolean }) {
    return (
      <div className={`px-2 py-1 rounded text-xs ${
        reached 
          ? 'bg-green-100 text-green-800 font-medium' 
          : 'bg-gray-100 text-gray-400'
      }`}>
        {reached ? '✓' : '○'} {label}
      </div>
    );
  }

  async function fetchDeviceList() {
    try {
      setLoadingDevices(true);
      const response = await fetch('/api/test-device-list');
      const data = await response.json();

      if (data.success) {
        setDeviceList(data);
      }
    } catch (err: any) {
      console.error('Error fetching device list:', err);
    } finally {
      setLoadingDevices(false);
    }
  }

  async function handleTestSend() {
    if (!testPhoneNumber || !testPhoneNumber.trim()) {
      alert('Please enter a phone number to send the test message to.');
      return;
    }

    try {
      setSendingMessage(true);
      setSendResult(null);
      setMessageStatus(null);

      // Step 1: Send message
      const sendResponse = await fetch('/api/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'This is a test message from Marketing Blast Tracker',
          to: testPhoneNumber.trim(),
        }),
      });

      const sendData = await sendResponse.json();
      console.log('[Frontend] Send response:', sendData);
      setSendResult(sendData);

      // Check if message was sent (even if success flag is false, messageId might exist)
      const messageId = sendData.messageId || sendData.data?.messageId || sendData.data?.id;
      
      if (messageId) {
        console.log('[Frontend] Message ID found:', messageId);
        // Step 2: Check message status after sending and start polling
        setCheckingStatus(true);
        setStatusHistory([]);
        
        // Wait 3 seconds before first check (message status might not be immediately available)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Initial check
        let consecutiveFailures = 0;
        const maxFailures = 3; // Stop after 3 consecutive failures
        
        const checkStatus = async () => {
          try {
            const statusResponse = await fetch('/api/test-message-info', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            body: JSON.stringify({
              messageId: messageId,
              to: testPhoneNumber.trim(),
              messageData: sendData.data?.data || sendData.data, // Pass full message data from send response
            }),
            });

            const statusData = await statusResponse.json();
            
            // If status check fails, increment failure counter
            if (!statusData.success) {
              consecutiveFailures++;
              console.log(`[Frontend] Status check failed (${consecutiveFailures}/${maxFailures}):`, statusData.error || statusData.message);
              
              // Stop polling after max failures
              if (consecutiveFailures >= maxFailures) {
                console.log('[Frontend] Stopping status polling due to repeated failures');
                setPollingActive(false);
                if ((window as any).statusPollInterval) {
                  clearInterval((window as any).statusPollInterval);
                }
                setMessageStatus({
                  ...statusData,
                  stopped: true,
                  message: `Status check stopped: ${statusData.message || statusData.error || 'Status not available yet. Message may still be processing.'}`,
                });
                return null;
              }
              
              setMessageStatus(statusData);
              return null;
            }
            
            // Reset failure counter on success
            consecutiveFailures = 0;
            
            // Add to status history
            if (statusData.status !== undefined || statusData.data) {
              setStatusHistory(prev => [...prev, {
                time: new Date(),
                status: statusData.status,
                data: statusData.data
              }]);
            }
            
            setMessageStatus(statusData);
            return statusData;
          } catch (statusErr: any) {
            consecutiveFailures++;
            console.error(`[Frontend] Status check error (${consecutiveFailures}/${maxFailures}):`, statusErr);
            
            if (consecutiveFailures >= maxFailures) {
              setPollingActive(false);
              if ((window as any).statusPollInterval) {
                clearInterval((window as any).statusPollInterval);
              }
            }
            
            setMessageStatus({
              success: false,
              error: statusErr.message || 'Failed to check message status',
            });
            return null;
          } finally {
            setCheckingStatus(false);
          }
        };

        // Initial check
        await checkStatus();

        // Start polling every 5 seconds for status updates
        // Stop if we get maxFailures consecutive failures
        setPollingActive(true);
        const pollInterval = setInterval(async () => {
          if (consecutiveFailures < maxFailures) {
            await checkStatus();
          } else {
            // Clear interval if max failures reached
            clearInterval(pollInterval);
            setPollingActive(false);
          }
        }, 5000);

        // Store interval ID to clear it later (cleanup on unmount or when needed)
        (window as any).statusPollInterval = pollInterval;
      } else {
        // Message might have been sent even if response format is unexpected
        if (messageId) {
          console.log('[Frontend] Message ID exists, proceeding with status check despite error flag');
          // Continue with status check even if success flag is false
        } else {
          console.error('[Frontend] No message ID found, cannot check status');
          alert(`Failed to send message: ${sendData.error || 'Unknown error'}\n\nCheck terminal logs for details.`);
        }
      }
    } catch (err: any) {
      setSendResult({ success: false, error: err.message });
      alert(`Error: ${err.message || 'Failed to send message'}`);
    } finally {
      setSendingMessage(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blast data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No blast data available</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Marketing Blast Tracker
            </h1>
            <p className="text-gray-600">
              Track and visualize your WhatsApp marketing message performance
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/webhook-events"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md"
            >
              📊 Webhook Events Debug
            </a>
            <button
              onClick={fetchDeviceList}
              disabled={loadingDevices}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {loadingDevices ? 'Loading...' : 'Refresh Device List'}
            </button>
            <button
              onClick={handleTestSend}
              disabled={sendingMessage}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {sendingMessage ? 'Sending...' : 'Test Send Message (v2)'}
            </button>
            <button
              onClick={async () => {
                if (!testPhoneNumber || !testPhoneNumber.trim()) {
                  alert('Please enter a phone number to send the test message to.');
                  return;
                }
                try {
                  setSendingMessage(true);
                  setSendResult(null);
                  const response = await fetch('/api/test-send-v1', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      message: 'Test message via /v1/sendMessage',
                      to: testPhoneNumber.trim(),
                    }),
                  });
                  const data = await response.json();
                  setSendResult(data);
                } catch (err: any) {
                  setSendResult({ success: false, error: err.message });
                } finally {
                  setSendingMessage(false);
                }
              }}
              disabled={sendingMessage}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {sendingMessage ? 'Sending...' : 'Test Send (v1)'}
            </button>
          </div>
        </div>

        {/* Test Phone Number Input */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
          <label htmlFor="test-phone" className="block text-sm font-medium text-gray-700 mb-2">
            Test Phone Number
          </label>
          <input
            id="test-phone"
            type="text"
            value={testPhoneNumber}
            onChange={(e) => setTestPhoneNumber(e.target.value)}
            placeholder="+60123456789"
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            Enter the phone number (with country code, e.g., +60123456789) to send test messages to.
          </p>
        </div>

        {/* Send Result */}
        {sendResult && (
          <div className={`mb-4 p-4 rounded-lg ${
            sendResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-semibold mb-3 ${
              sendResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {sendResult.success ? '✓ Message Sent Successfully' : '✗ Failed to Send Message'}
            </h3>
            
            {sendResult.success && (
              <div className="space-y-3">
                {sendResult.messageId && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Message ID:</span>
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded font-mono text-sm">{sendResult.messageId}</code>
                  </div>
                )}
                
                {/* Full Response */}
                <details className="mt-3">
                  <summary className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 mb-2">
                    📄 View Full Response Structure
                  </summary>
                  <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(sendResult.data || sendResult, null, 2)}
                    </pre>
                  </div>
                </details>

                {/* Exact Message Structure */}
                {sendResult.messageData && (
                  <details className="mt-3">
                    <summary className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900 mb-2">
                      🔑 View Exact Message Structure (for status checks)
                    </summary>
                    <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(sendResult.messageData, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            )}

            {sendResult.error && (
              <div className="mt-2">
                <p className="text-sm text-red-700 font-semibold mb-1">Error:</p>
                <p className="text-sm text-red-600">{sendResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Message Status */}
        {checkingStatus && (
          <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-800">Checking message status...</p>
            </div>
          </div>
        )}

        {messageStatus && !checkingStatus && (
          <div className={`mb-4 p-4 rounded-lg ${
            messageStatus.success ? 'bg-blue-50 border border-blue-200' : 
            messageStatus.stopped ? 'bg-gray-50 border border-gray-300' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`font-semibold ${
                messageStatus.success ? 'text-blue-800' : 
                messageStatus.stopped ? 'text-gray-700' :
                'text-yellow-800'
              }`}>
                📊 Message Status Tracking
                {messageStatus.stopped && <span className="text-xs font-normal ml-2">(Stopped)</span>}
              </h3>
              {pollingActive && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600">Polling active</span>
                  <button
                    onClick={() => {
                      if ((window as any).statusPollInterval) {
                        clearInterval((window as any).statusPollInterval);
                        setPollingActive(false);
                      }
                    }}
                    className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Stop
                  </button>
                </div>
              )}
            </div>

            {/* Error/Info Message */}
            {(messageStatus.message || messageStatus.error) && !messageStatus.success && (
              <div className={`mb-3 p-3 rounded text-sm ${
                messageStatus.stopped ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {messageStatus.stopped ? '⏸️ ' : 'ℹ️ '}
                {messageStatus.message || messageStatus.error}
                {messageStatus.stopped && (
                  <div className="text-xs mt-1 text-gray-600">
                    Status may become available later. Try checking manually or wait a few minutes.
                  </div>
                )}
              </div>
            )}

            {/* Status Stages Visualization */}
            {messageStatus.status !== undefined && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-700">Current Status:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                    {messageStatus.status}
                  </code>
                  <span className="text-xs text-gray-500">
                    ({getStatusLabel(messageStatus.status)})
                  </span>
                </div>

                {/* Status Progression */}
                <div className="flex items-center gap-2 mt-3 text-xs">
                  <StatusIndicator label="Sent" reached={true} />
                  <span className="text-gray-400">→</span>
                  <StatusIndicator label="Received" reached={messageStatus.status >= 1} />
                  <span className="text-gray-400">→</span>
                  <StatusIndicator label="Read" reached={messageStatus.status >= 2} />
                  <span className="text-gray-400">→</span>
                  <StatusIndicator label="Replied" reached={messageStatus.status >= 3} />
                </div>
              </div>
            )}

            {/* Status History */}
            {statusHistory.length > 0 && (
              <details className="mt-3">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 mb-2">
                  Status History ({statusHistory.length} updates)
                </summary>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {statusHistory.slice().reverse().map((entry, idx) => (
                    <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                      <div className="flex justify-between">
                        <span>
                          Status: <code className="bg-gray-100 px-1 rounded">{entry.status}</code>
                        </span>
                        <span className="text-gray-500">
                          {entry.time.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {messageStatus.data && (
              <details className="mt-2">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                  View Full Status Data
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(messageStatus.data, null, 2)}
                </pre>
              </details>
            )}
            {messageStatus.error && (
              <p className="text-sm text-yellow-700 mt-1">
                ⚠️ {messageStatus.error}
              </p>
            )}
          </div>
        )}

        {/* Device List */}
        {deviceList && (
          <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <h3 className="font-semibold mb-3 text-gray-800 text-lg">📱 Device List</h3>
            {deviceList.endpoint && (
              <p className="text-xs text-gray-500 mb-3">
                Endpoint: <code className="bg-gray-200 px-2 py-1 rounded">{deviceList.endpoint}</code>
              </p>
            )}
            {deviceList.data ? (
              <div>
                {Array.isArray(deviceList.data) && deviceList.data.length > 0 ? (
                  <div className="space-y-2">
                    {deviceList.data.map((device: any, index: number) => (
                      <div key={index} className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">
                              {device.device_name || `Device ${device.id_device || index + 1}`}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: {device.id_device || 'N/A'}
                            </div>
                            {device.status && (
                              <div className="text-sm mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  device.status === 'paired' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  Status: {device.status}
                                </span>
                              </div>
                            )}
                          </div>
                          {device.status === 'paired' && (
                            <div className="text-green-600 text-xs font-medium">
                              ✓ Online
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <p className="text-sm text-gray-600">Device data structure:</p>
                    <details className="mt-2">
                      <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                        View Raw Response
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
                        {JSON.stringify(deviceList.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No device data received</p>
            )}
          </div>
        )}

        {loadingDevices && (
          <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              <p className="text-sm text-gray-700">Loading device list...</p>
            </div>
          </div>
        )}

        <FunnelChart metrics={metrics} />
      </div>
    </main>
  );
}

