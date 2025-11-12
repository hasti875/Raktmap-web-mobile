import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users } from 'lucide-react';
// Remove this problematic import
// import { Chart } from '../Shared/Chart';
import axios from '../../utils/axios';

type ChartType = 'requests' | 'donors' | 'fulfillment';

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
const SimpleChart = ({ data, type }: { data: ChartData[], type: string }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <span>No data available</span>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  // Unified chart container style
  const chartContainerClass = "w-full max-w-2xl mx-auto py-6 flex items-center justify-center";

  if (type === 'bar' || type === 'line') {
    // Bar and line charts use the same attractive horizontal bar style
    return (
      <div className={chartContainerClass}>
        <div className="w-full space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-28 text-base text-gray-600 text-right mr-4">
                {item.label}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className="h-6 rounded-full flex items-center justify-end pr-3 text-white text-sm font-semibold shadow"
                  style={{
                    width: `${Math.max((item.value / maxValue) * 100, 16)}%`,
                    backgroundColor: item.color || '#dc2626',
                    minWidth: '40px',
                    transition: 'width 0.5s'
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
    // Attractive pie chart using SVG
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;
    return (
      <div className={chartContainerClass}>
        <svg width="220" height="220" viewBox="0 0 220 220">
          {data.map((item, index) => {
            const startAngle = (cumulative / total) * 2 * Math.PI;
            const endAngle = ((cumulative + item.value) / total) * 2 * Math.PI;
            const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
            const x1 = 110 + 100 * Math.cos(startAngle);
            const y1 = 110 + 100 * Math.sin(startAngle);
            const x2 = 110 + 100 * Math.cos(endAngle);
            const y2 = 110 + 100 * Math.sin(endAngle);
            const pathData = `M110,110 L${x1},${y1} A100,100 0 ${largeArcFlag},1 ${x2},${y2} Z`;
            cumulative += item.value;
            return (
              <path key={index} d={pathData} fill={item.color || '#dc2626'} stroke="#fff" strokeWidth="2" />
            );
          })}
        </svg>
        <div className="ml-8 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: item.color || '#dc2626' }}></div>
              <span className="text-base text-gray-700 font-medium">{item.label}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'bubble') {
    // Simple attractive bubble chart using SVG
    const maxBubble = Math.max(...data.map(d => d.value));
    return (
      <div className={chartContainerClass}>
        <svg width="400" height="120">
          {data.map((item, index) => (
            <circle
              key={index}
              cx={60 + index * 80}
              cy={60}
              r={20 + (item.value / maxBubble) * 30}
              fill={item.color || '#dc2626'}
              opacity="0.7"
            />
          ))}
        </svg>
        <div className="ml-8 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: item.color || '#dc2626' }}></div>
              <span className="text-base text-gray-700 font-medium">{item.label}: {item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

export function Analytics() {
  const [selectedChart, setSelectedChart] = useState<ChartType>('requests');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('weeks');
  
  // Initialize with fallback data instead of empty values
  const [stats, setStats] = useState<AnalyticsStats>({
    totalRequests: 1245,
    donorsResponded: 980,
    fulfillmentRate: 87,
    avgResponseTime: '2m 30s'
  });
  
  // Initialize with fallback chart data
  const [chartData, setChartData] = useState<ChartData[]>([
    { label: 'Loading...', value: 0, color: '#6b7280' },
  ]);
  
  // Remove unused loading state
  const [error, setError] = useState<string | null>(null);

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

  // Fetch chart data based on selected type and period
  const fetchChartData = async (chartType: ChartType, period: string = selectedPeriod) => {
    try {
      console.log(`Fetching chart data for: ${chartType}, period: ${period}`);
      let endpoint = '';
      switch (chartType) {
        case 'requests':
          endpoint = `/blood-requests/admin/analytics/request-trends?period=${period}`;
          break;
        case 'donors':
          endpoint = '/blood-requests/admin/analytics/donors-by-blood-type';
          break;
        case 'fulfillment':
          endpoint = '/blood-requests/admin/analytics/fulfillment-breakdown';
          break;
      }

      console.log('API endpoint:', endpoint);
      const response = await axios.get(endpoint);
      console.log('API response:', response.data);
      
      if (response.data && response.data.success && response.data.data) {
        if (chartType === 'donors') {
          // Show all blood groups, including those with 0 donations
          const apiGroups = response.data.data;
          setChartData(apiGroups);
        } else if (chartType === 'fulfillment') {
          // Use only real API data for fulfillment
          const apiGroups = response.data.data;
          const realData = apiGroups.filter((item: ChartData) => item.value > 0);
          setChartData(realData.length > 0 ? realData : [{ label: 'No data yet', value: 0, color: '#6b7280' }]);
        } else {
          // For other chart types, use API data directly
          setChartData(response.data.data);
        }
        setError(null);
      } else {
        // If API returns no data, show "No data" message instead of fallback
        setChartData([{ label: 'No data available', value: 0, color: '#6b7280' }]);
      }
      setError(null);
    } catch (error) {
      console.error(`Error fetching chart data for ${chartType}:`, error);
      // On error, show "No data" message instead of fallback dummy data
      setChartData([{ label: 'Connection error', value: 0, color: '#ef4444' }]);
      setError('Failed to load chart data');
    }
  };

  // Handle chart selection
  const handleChartChange = (chartType: ChartType) => {
    console.log('=== Chart change requested ===');
    console.log('New chart type:', chartType);
    console.log('Previous chart type:', selectedChart);
    
    setSelectedChart(chartType);
    // Start with loading state instead of dummy data
    setChartData([{ label: 'Loading...', value: 0, color: '#6b7280' }]);
    // Fetch real data
    fetchChartData(chartType, selectedPeriod).catch(err => {
      console.error('Chart fetch failed:', err);
      setChartData([{ label: 'Failed to load', value: 0, color: '#ef4444' }]);
    });
  };

  // Handle period selection (only for requests chart)
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (selectedChart === 'requests') {
      setChartData([{ label: 'Loading...', value: 0, color: '#6b7280' }]);
      fetchChartData('requests', period).catch(err => {
        console.error('Period fetch failed:', err);
        setChartData([{ label: 'Failed to load', value: 0, color: '#ef4444' }]);
      });
    }
  };

  useEffect(() => {
    console.log('Analytics component mounted, loading initial data...');
    // Load initial data with loading state
    setChartData([{ label: 'Loading...', value: 0, color: '#6b7280' }]);
    fetchStats().catch(err => console.error('Initial stats fetch failed:', err));
    fetchChartData('requests', 'weeks').catch(err => console.error('Initial chart fetch failed:', err));
  }, []);

  // Get chart configuration
  const getChartConfig = () => {
    const periodTitles = {
      'weeks': 'Current Month (Weeks)',
      '6months': 'Last 6 Months',
      'year': 'Last Year'
    };

    switch (selectedChart) {
      case 'requests':
        return {
          title: `Total Requests Trend (${periodTitles[selectedPeriod as keyof typeof periodTitles] || 'Current Month'})`,
          type: 'bar' as const,
          data: Array.isArray(chartData) ? chartData : []
        };
      case 'donors':
        return {
          title: 'Donors Response by Blood Type',
          type: 'line' as const,
          data: Array.isArray(chartData) ? chartData : []
        };
      case 'fulfillment':
        return {
          title: 'Request Fulfillment Rate',
          type: 'pie' as const,
          data: Array.isArray(chartData) ? chartData : []
        };
      default:
        return {
          title: 'Chart',
          type: 'bar' as const,
          data: Array.isArray(chartData) ? chartData : []
        };
    }
  };

  const chartConfig = getChartConfig();
  
  console.log('=== Chart Configuration ===');
  console.log('Selected Chart:', selectedChart);
  console.log('Chart Config:', chartConfig);
  console.log('Chart Data:', chartData);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => handleChartChange('requests')}
          className={`bg-white rounded-2xl shadow p-6 flex flex-col items-center border transition-all duration-200 hover:shadow-lg ${
            selectedChart === 'requests' 
              ? 'border-red-500 ring-2 ring-red-200' 
              : 'border-red-100 hover:border-red-300'
          }`}
        >
          <TrendingUp className="h-8 w-8 text-red-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{(stats.totalRequests ?? 0).toLocaleString()}</div>
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
          <div className="text-2xl font-bold text-gray-900">{(stats.donorsResponded ?? 0).toLocaleString()}</div>
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
          <div className="text-2xl font-bold text-gray-900">{(stats.fulfillmentRate ?? 0)}%</div>
          <div className="text-gray-600">Fulfillment Rate</div>
        </button>
      </div>
      
      {/* Chart Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">{chartConfig.title}</h3>
          
          {/* Period Dropdown - only show for requests chart */}
          {selectedChart === 'requests' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Period:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="weeks">Current Month (Weeks)</option>
                <option value="6months">Last 6 Months</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="h-auto min-h-[400px]">
          {chartData && chartData.length > 0 ? (
            <div className="w-full">
              {/* Try to use the Chart component, fallback to SimpleChart */}
              <div className="chart-container">
                <SimpleChart
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
          <p>Error: {error || 'None'}</p>
          <p>Stats: {JSON.stringify(stats)}</p>
        </div>
      )}
    </div>
  );
}

// Make sure to export as default
export default Analytics;