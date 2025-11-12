import { useState, useEffect } from 'react';
import { Heart, Users, CheckCircle, MapPin, Phone, RefreshCw } from 'lucide-react';
import { StatsCard } from '../Shared/StatsCard';
import { DonorsList } from './DonorsList';
import axios from 'axios';

interface DashboardStats {
  activeRequests: number;
  availableDonors: number;
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
  const [isDonorsListOpen, setIsDonorsListOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    activeRequests: 0,
    availableDonors: 0,
    completedThisMonth: 0
  });
  const [recentRequests, setRecentRequests] = useState<BloodRequest[]>([]);
  const [respondingDonors, setRespondingDonors] = useState<RespondingDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch recent blood requests from blood-requests endpoint
      try {
        const requestsResponse = await axios.get('http://localhost:5000/blood-requests/hospital', config);
        if (requestsResponse.data.success) {
          // Get recent requests (last 5)
          const allRequests = requestsResponse.data.bloodRequests || [];
          const recentRequests = allRequests.slice(0, 5).map((request: any) => ({
            _id: request._id,
            bloodGroup: request.bloodGroup,
            units: request.quantity || 1,
            urgency: request.urgency,
            status: request.status,
            createdAt: request.createdAt
          }));
          setRecentRequests(recentRequests);

          // Calculate stats from the requests
          const activeCount = allRequests.filter((req: any) => req.status === 'pending').length;
          const completedCount = allRequests.filter((req: any) => req.status === 'fulfilled').length;
          
          setStats(prevStats => ({
            ...prevStats,
            activeRequests: activeCount,
            completedThisMonth: completedCount
          }));
        }
      } catch (reqErr) {
        console.log('Failed to fetch blood requests:', reqErr);
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
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
          
          // Update available donors count to all donors (not just responded ones)
          setStats(prevStats => ({
            ...prevStats,
            availableDonors: donors.length
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              title="Active Requests"
              value={stats.activeRequests}
              icon={Heart}
              color="red"
            />
            <StatsCard
              title="Available Donors"
              value={stats.availableDonors}
              icon={Users}
              color="blue"
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
                  onClick={fetchDashboardData}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <RefreshCw className="h-4 w-4" />
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
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'fulfilled' 
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
                onClick={() => setIsDonorsListOpen(true)}
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

      {/* Donors List Modal */}
      <DonorsList 
        isOpen={isDonorsListOpen} 
        onClose={() => setIsDonorsListOpen(false)} 
      />
    </div>
  );
}