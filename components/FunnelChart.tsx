'use client';

import type { BlastMetrics, FunnelStage } from '@/types';

interface FunnelChartProps {
  metrics: BlastMetrics;
}

export default function FunnelChart({ metrics }: FunnelChartProps) {
  // Calculate stages with percentages
  const stages: FunnelStage[] = [
    {
      label: 'Sent',
      count: metrics.sent,
      percentage: 100,
    },
    {
      label: 'Received',
      count: metrics.received,
      percentage: metrics.sent > 0 ? (metrics.received / metrics.sent) * 100 : 0,
    },
    {
      label: 'Read',
      count: metrics.read,
      percentage: metrics.sent > 0 ? (metrics.read / metrics.sent) * 100 : 0,
    },
    {
      label: 'Replied',
      count: metrics.replied,
      percentage: metrics.sent > 0 ? (metrics.replied / metrics.sent) * 100 : 0,
    },
    {
      label: 'Closed',
      count: metrics.closed,
      percentage: metrics.sent > 0 ? (metrics.closed / metrics.sent) * 100 : 0,
    },
  ];

  // Calculate widths based on count relative to max
  const maxCount = Math.max(...stages.map(s => s.count));
  const baseWidth = 100; // Base width percentage for the first stage

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Marketing Blast Funnel</h2>
      
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
        {stages.map((stage, index) => {
          // Calculate width relative to the first stage (Sent = 100%)
          const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const width = index === 0 ? 100 : widthPercentage;

          // Color gradient from blue to green
          const colors = [
            'bg-blue-500',
            'bg-blue-400',
            'bg-blue-300',
            'bg-green-400',
            'bg-green-500',
          ];

          return (
            <div key={stage.label} className="flex flex-col items-center min-w-[120px]">
              {/* Arrow between stages */}
              {index > 0 && (
                <div className="flex items-center justify-center mb-2">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              )}

              {/* Funnel Stage Box */}
              <div className="w-full flex flex-col items-center">
                <div
                  className={`w-full ${colors[index]} text-white rounded-lg p-4 shadow-md transition-all duration-300 hover:shadow-lg`}
                  style={{ minHeight: '100px' }}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">{stage.count.toLocaleString()}</div>
                    <div className="text-sm font-medium opacity-90">{stage.label}</div>
                  </div>
                </div>

                {/* Percentage */}
                <div className="mt-2 text-sm text-gray-600 font-medium">
                  {stage.percentage.toFixed(1)}%
                </div>

                {/* Drop-off percentage (except for first stage) */}
                {index > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    {(() => {
                      const previousPercentage = stages[index - 1].percentage;
                      const dropOff = previousPercentage - stage.percentage;
                      return dropOff > 0 ? `-${dropOff.toFixed(1)}%` : '';
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 md:grid-cols-5 gap-4">
        {stages.map((stage, index) => (
          <div key={stage.label} className="text-center">
            <div className="text-sm text-gray-500">{stage.label} Rate</div>
            <div className="text-lg font-semibold text-gray-800">
              {index === 0
                ? '100%'
                : stages[index - 1].count > 0
                ? ((stage.count / stages[index - 1].count) * 100).toFixed(1) + '%'
                : '0%'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

