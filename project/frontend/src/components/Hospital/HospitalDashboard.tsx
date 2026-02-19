import { useState, useEffect } from 'react';
import { Heart, Users, CheckCircle, MapPin, Phone, RefreshCw } from 'lucide-react';
import { StatsCard } from '../Shared/StatsCard';
import axios from 'axios';
import { toast } from 'react-toastify';

// Helper function to decode JWT and extract hospital ID
const getHospitalIdFromToken = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decoded = JSON.parse(jsonPayload);
    return decoded.id || null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

interface DashboardStats {
  activeRequests: number;
  availableDonors: number;
  totalDonors: number;
  completedThisMonth: number;
}

interface BloodRequest {
  _id: string;
  bloodGroup: string;
  units: number;
  urgency: string;
  status: string;
  createdAt: string;
}

interface RespondingDonor {
  id: number;
  name: string;
  bloodGroup: string;
  distance: string;
  phone: string;
  status: string;
}

export function HospitalDashboard({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    activeRequests: 0,
    availableDonors: 0,
    totalDonors: 0,
    completedThisMonth: 0
  });
  const [recentRequests, setRecentRequests] = useState<BloodRequest[]>([]);
  const [respondingDonors, setRespondingDonors] = useState<RespondingDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();

    // Listen for blood request updates from the centralized SSE connection
    const handleUpdate = () => {
      console.log('🔄 Blood request update received, refreshing dashboard...');
      fetchDashboardData();
    };

    window.addEventListener('bloodRequestUpdate', handleUpdate);

    return () => {
      window.removeEventListener('bloodRequestUpdate', handleUpdate);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      };

      // Fetch recent blood requests from blood-requests endpoint
      try {
        console.log('🔄 Fetching blood requests from hospital dashboard...');
        const requestsResponse = await axios.get('http://localhost:5000/blood-requests/hospital', config);
        console.log('📥 Blood requests response:', requestsResponse.data);
        
        if (requestsResponse.data.success) {
          // Get recent requests (last 5)
          const allRequests = requestsResponse.data.bloodRequests || [];
          console.log(`📋 Total requests: ${allRequests.length}`);
          
          const recentRequests = allRequests.slice(0, 5).map((request: any) => ({
            _id: request._id,
            bloodGroup: request.bloodGroup,
            units: request.quantity || 1,
            urgency: request.urgency,
            status: request.status,
            createdAt: request.createdAt
          }));
          setRecentRequests(recentRequests);
          console.log(`✅ Set ${recentRequests.length} recent requests`);

          // Calculate stats from the requests
          const activeCount = allRequests.filter((req: any) => req.status === 'pending').length;
          const completedCount = allRequests.filter((req: any) => req.status === 'fulfilled').length;

          setStats(prevStats => ({
            ...prevStats,
            activeRequests: activeCount,
            completedThisMonth: completedCount
          }));
        }
      } catch (reqErr: any) {
        console.error('❌ Failed to fetch blood requests:', reqErr);
        console.error('Error details:', reqErr.response?.data);
        setRecentRequests([]);
      }

      // Fetch available donors (use the same endpoint as Available Donors page)
      try {
        const availableDonorsResponse = await axios.get('http://localhost:5000/donor-response/available-donors');
        if (availableDonorsResponse.data.success) {
          const donors = availableDonorsResponse.data.donors || [];

          // Calculate distance for each donor (simplified calculation)
          const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
            const R = 6371; // Earth's radius in kilometers
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          };

          // Hospital location (Charusat coordinates)
          const hospitalLat = 22.6013;
          const hospitalLng = 72.8327;

          // Filter to only donors who have responded (have location data) and show top 5
          const respondedDonors = donors
            .filter((donor: any) => donor.hasLocationData && donor.location)
            .slice(0, 5);

          const formattedDonors: RespondingDonor[] = respondedDonors.map((donor: any, index: number) => {
            const distance = donor.location ?
              calculateDistance(hospitalLat, hospitalLng, donor.location.lat, donor.location.lng) :
              null;

            return {
              id: index + 1,
              name: donor.name || 'Unknown Donor',
              bloodGroup: donor.bloodGroup || 'Unknown',
              distance: distance ? `${distance.toFixed(1)} km` : 'N/A',
              phone: donor.phone || 'N/A',
              status: donor.status || 'responded'
            };
          });

          setRespondingDonors(formattedDonors);

          // Update donor counts
          const donorsWithLocation = donors.filter((donor: any) => donor.hasLocationData && donor.location);
          setStats(prevStats => ({
            ...prevStats,
            totalDonors: donors.length, // Total donors in database
            availableDonors: donorsWithLocation.length // Only donors with location
          }));
        }
      } catch (donorErr) {
        console.error('Failed to fetch available donors:', donorErr);
        // Only use fallback if we really can't get data
        setRespondingDonors([]);
        setStats(prevStats => ({
          ...prevStats,
          availableDonors: 0
        }));
      }

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');

      // Set empty data instead of mock data
      setStats({
        activeRequests: 0,
        availableDonors: 0,
        totalDonors: 0,
        completedThisMonth: 0
      });

      setRecentRequests([]);
      setRespondingDonors([]);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'responded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading dashboard...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-red-700 dark:text-red-300">Error loading dashboard: {error}</span>
            <button
              onClick={fetchDashboardData}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && !error && (
        <>
          {/* Prominent Request Blood Button */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">Need Blood Urgently?</h2>
                <p className="text-red-100">Send emergency blood request to matching donors instantly</p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('request-blood')}
                className="bg-white text-red-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-50 transition-all transform hover:scale-105 shadow-xl flex items-center space-x-2"
              >
                <Heart className="h-6 w-6" />
                <span>Request Blood</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Active Requests"
              value={stats.activeRequests}
              icon={Heart}
              color="red"
            />
            <StatsCard
              title="Available Donors"
              value={stats.availableDonors}
              icon={MapPin}
              color="blue"
            />
            <StatsCard
              title="Total Donors"
              value={stats.totalDonors}
              icon={Users}
              color="yellow"
            />
            <StatsCard
              title="Completed This Month"
              value={stats.completedThisMonth}
              icon={CheckCircle}
              trend={{ value: 20, isPositive: true }}
              color="green"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Blood Requests</h3>
                <button
                  onClick={() => {
                    console.log('🔄 Manual refresh triggered');
                    fetchDashboardData();
                  }}
                  className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Refresh requests"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="space-y-4">
                {recentRequests.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No recent blood requests
                  </p>
                ) : (
                  recentRequests.map((request) => (
                    <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">{request.bloodGroup}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.units} units • {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${request.status === 'fulfilled'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                        {request.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Responding Donors</h3>
              <div className="space-y-4">
                {respondingDonors.map((donor) => (
                  <div key={donor.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">{donor.name}</span>
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">{donor.bloodGroup}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-3 w-3 mr-1" />
                          {donor.distance}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-3 w-3 mr-1" />
                          {donor.phone}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donor.status)}`}>
                      {donor.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => onNavigate && onNavigate('request-blood')}
                className="p-4 border-2 border-dashed border-red-300 dark:border-red-700 rounded-lg text-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Heart className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Emergency Request</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Send urgent blood request</p>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('donors')}
                className="p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg text-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">View Donors</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Browse available donors</p>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('map')}
                className="p-4 border-2 border-dashed border-green-300 dark:border-green-700 rounded-lg text-center hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">Live Map</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Track donor locations</p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}