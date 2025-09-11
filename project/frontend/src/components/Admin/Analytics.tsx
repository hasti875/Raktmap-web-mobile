import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Activity } from 'lucide-react';
// Remove this problematic import
// import { Chart } from '../Shared/Chart';
import axios from '../../utils/axios';

type ChartType = 'requests' | 'donors' | 'fulfillment' | 'avgTime';

interface AnalyticsStats {
  totalRequests: number;
  donorsResponded: number;
  fulfillmentRate: number;
  avgResponseTime: string;
}

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

// Move SimpleChart outside the component to prevent re-creation
const SimpleChart = ({ data, type, title }: { data: ChartData[], type: string, title: string }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <span>No data available</span>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  if (type === 'bar') {
    return (
      <div className="w-full">
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-20 text-sm text-gray-600 text-right mr-3">
                {item.label}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className="h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                  style={{
                    width: `${Math.max((item.value / maxValue) * 100, 5)}%`,
                    backgroundColor: item.color || '#dc2626',
                    minWidth: '30px'
                  }}
                >
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {data.map((item, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: item.color || '#dc2626' }}
                ></div>
                <span className="text-sm text-gray-600">
                  {item.label}: {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Line chart (simplified as bar chart)
  return (
    <div className="w-full">
      <div className="flex items-end justify-between h-48 border-b border-l border-gray-300 pl-4 pb-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <div
              className="bg-red-500 rounded-t"
              style={{
                height: `${Math.max((item.value / maxValue) * 160, 10)}px`,
                width: '40px',
                backgroundColor: item.color || '#dc2626'
              }}
            ></div>
            <div className="text-xs text-gray-600 transform -rotate-45 origin-top-left whitespace-nowrap">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function Analytics() {
  const [selectedChart, setSelectedChart] = useState<ChartType>('requests');
  
  // Initialize with fallback data instead of empty values
  const [stats, setStats] = useState<AnalyticsStats>({
    totalRequests: 1245,
    donorsResponded: 980,
    fulfillmentRate: 87,
    avgResponseTime: '2m 30s'
  });
  
  // Initialize with fallback chart data
  const [chartData, setChartData] = useState<ChartData[]>([
    { label: 'Week 1', value: 45, color: '#dc2626' },
    { label: 'Week 2', value: 52, color: '#dc2626' },
    { label: 'Week 3', value: 48, color: '#dc2626' },
    { label: 'Week 4', value: 55, color: '#dc2626' },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback data for different chart types
  const getFallbackData = (chartType: ChartType): ChartData[] => {
    switch (chartType) {
      case 'requests':
        return [
          { label: 'Week 1', value: 45, color: '#dc2626' },
          { label: 'Week 2', value: 52, color: '#dc2626' },
          { label: 'Week 3', value: 48, color: '#dc2626' },
          { label: 'Week 4', value: 55, color: '#dc2626' },
        ];
      case 'donors':
        return [
          { label: 'O+', value: 35, color: '#dc2626' },
          { label: 'A+', value: 28, color: '#059669' },
          { label: 'B+', value: 20, color: '#2563eb' },
          { label: 'AB+', value: 10, color: '#7c3aed' },
          { label: 'O-', value: 4, color: '#ea580c' },
          { label: 'A-', value: 2, color: '#0891b2' },
          { label: 'B-', value: 1, color: '#be185d' },
          { label: 'AB-', value: 1, color: '#65a30d' },
        ];
      case 'fulfillment':
        return [
          { label: 'Fulfilled', value: 68, color: '#059669' },
          { label: 'Pending', value: 25, color: '#eab308' },
          { label: 'Cancelled', value: 7, color: '#dc2626' },
        ];
      case 'avgTime':
        return [
          { label: '6AM-9AM', value: 150, color: '#2563eb' },
          { label: '9AM-12PM', value: 120, color: '#2563eb' },
          { label: '12PM-3PM', value: 90, color: '#2563eb' },
          { label: '3PM-6PM', value: 110, color: '#2563eb' },
          { label: '6PM-9PM', value: 180, color: '#2563eb' },
          { label: '9PM-12AM', value: 240, color: '#2563eb' },
        ];
      default:
        return [
          { label: 'No Data', value: 0, color: '#gray-400' }
        ];
    }
  };

  // Fetch analytics stats
  const fetchStats = async () => {
    try {
      console.log('Fetching analytics stats...');
      const response = await axios.get('/admin/analytics/stats');
      if (response.data && response.data.success) {
        setStats(response.data.data);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching analytics stats:', error);
      console.log('Using fallback stats data');
      setError('API connection failed');
    }
  };

  // Fetch chart data based on selected type
  const fetchChartData = async (chartType: ChartType) => {
    try {
      console.log(`Fetching chart data for: ${chartType}`);
      let endpoint = '';
      switch (chartType) {
        case 'requests':
          endpoint = '/admin/analytics/request-trends';
          break;
        case 'donors':
          endpoint = '/admin/analytics/donors-by-blood-type';
          break;
        case 'fulfillment':
          endpoint = '/admin/analytics/fulfillment-breakdown';
          break;
        case 'avgTime':
          endpoint = '/admin/analytics/response-times-by-hour';
          break;
      }

      const response = await axios.get(endpoint);
      if (response.data && response.data.success && response.data.data) {
        setChartData(response.data.data);
        setError(null);
      } else {
        setChartData(getFallbackData(chartType));
      }
    } catch (error) {
      console.error(`Error fetching chart data for ${chartType}:`, error);
      setChartData(getFallbackData(chartType));
      setError('API connection failed');
    }
  };

  // Handle chart selection
  const handleChartChange = (chartType: ChartType) => {
    try {
      setSelectedChart(chartType);
      const fallbackData = getFallbackData(chartType);
      setChartData(fallbackData);
      
      // Try to fetch real data in background
      fetchChartData(chartType).catch(err => {
        console.error('Background fetch failed:', err);
      });
    } catch (error) {
      console.error('Error in handleChartChange:', error);
    }
  };

  useEffect(() => {
    try {
      console.log('Analytics component mounted, loading initial data...');
      
      // Load initial data
      fetchStats().catch(err => console.error('Initial stats fetch failed:', err));
      fetchChartData('requests').catch(err => console.error('Initial chart fetch failed:', err));
    } catch (error) {
      console.error('Error in useEffect:', error);
    }
  }, []);

  // Get chart configuration
  const getChartConfig = () => {
    try {
      switch (selectedChart) {
        case 'requests':
          return {
            title: 'Total Requests Trend (Last 4 Weeks)',
            type: 'line' as const,
            data: chartData || []
          };
        case 'donors':
          return {
            title: 'Donors Response by Blood Type',
            type: 'bar' as const,
            data: chartData || []
          };
        case 'fulfillment':
          return {
            title: 'Request Fulfillment Rate',
            type: 'pie' as const,
            data: chartData || []
          };
        case 'avgTime':
          return {
            title: 'Average Response Time by Hour',
            type: 'bar' as const,
            data: chartData || []
          };
        default:
          return {
            title: 'Chart',
            type: 'line' as const,
            data: chartData || []
          };
      }
    } catch (error) {
      console.error('Error in getChartConfig:', error);
      return {
        title: 'Chart Error',
        type: 'line' as const,
        data: []
      };
    }
  };

  try {
    const chartConfig = getChartConfig();

    return (
      <div className="space-y-8 p-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
          <p className="text-gray-600">Key metrics and trends for blood requests and donations</p>
        </div>

        {/* Connection status */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Unable to fetch live data. Showing demo analytics data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <button
            onClick={() => handleChartChange('requests')}
            className={`bg-white rounded-2xl shadow p-6 flex flex-col items-center border transition-all duration-200 hover:shadow-lg ${
              selectedChart === 'requests' 
                ? 'border-red-500 ring-2 ring-red-200' 
                : 'border-red-100 hover:border-red-300'
            }`}
          >
            <TrendingUp className="h-8 w-8 text-red-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.totalRequests.toLocaleString()}</div>
            <div className="text-gray-600">Total Requests</div>
          </button>
          
          <button
            onClick={() => handleChartChange('donors')}
            className={`bg-white rounded-2xl shadow p-6 flex flex-col items-center border transition-all duration-200 hover:shadow-lg ${
              selectedChart === 'donors' 
                ? 'border-green-500 ring-2 ring-green-200' 
                : 'border-red-100 hover:border-green-300'
            }`}
          >
            <Users className="h-8 w-8 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.donorsResponded.toLocaleString()}</div>
            <div className="text-gray-600">Donors Responded</div>
          </button>
          
          <button
            onClick={() => handleChartChange('fulfillment')}
            className={`bg-white rounded-2xl shadow p-6 flex flex-col items-center border transition-all duration-200 hover:shadow-lg ${
              selectedChart === 'fulfillment' 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-red-100 hover:border-blue-300'
            }`}
          >
            <BarChart2 className="h-8 w-8 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.fulfillmentRate}%</div>
            <div className="text-gray-600">Fulfillment Rate</div>
          </button>
          
          <button
            onClick={() => handleChartChange('avgTime')}
            className={`bg-white rounded-2xl shadow p-6 flex flex-col items-center border transition-all duration-200 hover:shadow-lg ${
              selectedChart === 'avgTime' 
                ? 'border-yellow-500 ring-2 ring-yellow-200' 
                : 'border-red-100 hover:border-yellow-300'
            }`}
          >
            <Activity className="h-8 w-8 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{stats.avgResponseTime}</div>
            <div className="text-gray-600">Avg. Response Time</div>
          </button>
        </div>
        
        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{chartConfig.title}</h3>
          <div className="h-auto min-h-[400px]">
            {chartData && chartData.length > 0 ? (
              <div className="w-full">
                {/* Try to use the Chart component, fallback to SimpleChart */}
                <div className="chart-container">
                  <SimpleChart
                    title={chartConfig.title}
                    data={chartConfig.data}
                    type={chartConfig.type}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <BarChart2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <span>No data available for selected chart</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug Info (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
            <p><strong>Debug Info:</strong></p>
            <p>Selected Chart: {selectedChart}</p>
            <p>Chart Data Length: {chartData?.length || 0}</p>
            <p>Loading: {loading.toString()}</p>
            <p>Error: {error || 'None'}</p>
            <p>Stats: {JSON.stringify(stats)}</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in Analytics component render:', error);
    return null;
  }
}

// Make sure to export as default
export default Analytics;