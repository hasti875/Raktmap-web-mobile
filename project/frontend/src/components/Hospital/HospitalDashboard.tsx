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

      // Fetch responding donors
      try {
        const donorResponsesResponse = await axios.get('http://localhost:5000/donor-response/locations');
        if (donorResponsesResponse.data.success) {
          const responses = donorResponsesResponse.data.responses || [];
          const formattedDonors: RespondingDonor[] = responses.slice(0, 5).map((donor: any, index: number) => ({
            id: index + 1,
            name: donor.name || 'Unknown Donor',
            bloodGroup: donor.bloodGroup || 'Unknown',
            distance: donor.location ? '2.5 km' : 'N/A', // Mock distance calculation
            phone: donor.phone || 'N/A',
            status: donor.status || 'responded'
          }));
          setRespondingDonors(formattedDonors);
          
          // Update available donors count
          setStats(prevStats => ({
            ...prevStats,
            availableDonors: responses.length
          }));
        }
      } catch (donorErr) {
        console.log('Failed to fetch responding donors, using fallback data');
        setRespondingDonors([
          { id: 1, name: 'John Doe', bloodGroup: 'O-', distance: '2.3 km', phone: '+1 234-567-8901', status: 'confirmed' },
          { id: 2, name: 'Jane Smith', bloodGroup: 'A+', distance: '1.8 km', phone: '+1 234-567-8902', status: 'responded' },
          { id: 3, name: 'Mike Johnson', bloodGroup: 'B+', distance: '3.1 km', phone: '+1 234-567-8903', status: 'contacted' },
        ]);
      }

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      
      // Fallback to mock data for development
      setStats({
        activeRequests: 3,
        availableDonors: 15,
        completedThisMonth: 8
      });
      
      setRecentRequests([
        {
          _id: 'mock1',
          bloodGroup: 'O-',
          units: 2,
          urgency: 'high',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'mock2',
          bloodGroup: 'A+',
          units: 1,
          urgency: 'medium',
          status: 'fulfilled',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
      
      // Fallback responding donors
      setRespondingDonors([
        { id: 1, name: 'John Doe', bloodGroup: 'O-', distance: '2.3 km', phone: '+1 234-567-8901', status: 'confirmed' },
        { id: 2, name: 'Jane Smith', bloodGroup: 'A+', distance: '1.8 km', phone: '+1 234-567-8902', status: 'responded' },
        { id: 3, name: 'Mike Johnson', bloodGroup: 'B+', distance: '3.1 km', phone: '+1 234-567-8903', status: 'contacted' },
      ]);
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