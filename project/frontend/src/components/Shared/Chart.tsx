import React from 'react';

interface ChartProps {
  title: string;
  data: { label: string; value: number; color?: string }[];
  type: 'bar' | 'pie' | 'line';
}

export function Chart({ title, data, type }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  // Set a minimum scale for better visual representation
  const scaleMax = Math.max(maxValue, 10);

  if (type === 'bar') {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-20 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color || '#dc2626' }}
                ></span>
                {item.label}
              </div>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    backgroundColor: item.color || '#dc2626',
                    width: item.value === 0 ? '0%' : `${(item.value / scaleMax) * 100}%`
                  }}
                ></div>
              </div>
              <div className="w-8 text-sm font-medium text-gray-900 dark:text-white text-right">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex items-center space-x-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const strokeDashoffset = -cumulativePercentage;
                cumulativePercentage += percentage;
                
                return (
                  <path
                    key={index}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={item.color || '#dc2626'}
                    strokeWidth="2"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                  />
                );
              })}
            </svg>
          </div>
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color || '#dc2626' }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'line') {
    const height = 200;
    const width = 400;
    const padding = 40;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;

    const points = data.map((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - (item.value / scaleMax) * chartHeight;
      return { x, y, value: item.value, label: item.label };
    });

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="relative">
          <svg width={width} height={height} className="overflow-visible">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding}
                y1={padding + chartHeight * ratio}
                x2={padding + chartWidth}
                y2={padding + chartHeight * ratio}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            ))}
            
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <text
                key={ratio}
                x={padding - 10}
                y={padding + chartHeight * (1 - ratio) + 4}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {Math.round(scaleMax * ratio)}
              </text>
            ))}
            
            {/* Line path */}
            <path
              d={pathData}
              fill="none"
              stroke={data[0]?.color || '#dc2626'}
              strokeWidth="2"
              className="drop-shadow-sm"
            />
            
            {/* Data points */}
            {points.map((point, index) => (
              <g key={index}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={data[index]?.color || '#dc2626'}
                  className="drop-shadow-sm"
                />
                <text
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  }

  return <div>Chart type not implemented</div>;
}