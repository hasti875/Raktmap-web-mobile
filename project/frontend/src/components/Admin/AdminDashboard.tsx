import React, { useEffect, useState } from 'react';
import { Building2, Users, Heart, Activity, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { StatsCard } from '../Shared/StatsCard';
import { Chart } from '../Shared/Chart';
import axios from '../../utils/axios';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalHospitals: 0,
    activeDonors: 0,
    bloodRequests: 0,
    responseRate: 0
  });
  const [donors, setDonors] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [bloodRequests, setBloodRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch hospitals, donors, and blood requests in parallel
      const [hospitalsResponse, donorsResponse, bloodRequestsResponse] = await Promise.all([
        axios.get('/hospitals'),
        axios.get('/donors'),
        axios.get('/blood-requests/all')
      ]);

      const hospitals = hospitalsResponse.data.success ? hospitalsResponse.data.hospitals : [];
      const donorsList = donorsResponse.data || [];
      const bloodRequestsList = bloodRequestsResponse.data.bloodRequests || [];
      
      setDonors(donorsList);
      setBloodRequests(bloodRequestsList);
      
      // Create recent activity from blood requests (most recent first)
      const activities = bloodRequestsList.slice(0, 4).map((req: any, index: number) => ({
        id: index + 1,
        action: `Blood request ${req.status}`,
        hospital: req.hospitalName || `Hospital ID: ${req.hospitalId}`,
        request: `${req.quantity} units of ${req.bloodGroup}`,
        time: new Date(req.createdAt || req.requestedAt).toLocaleDateString()
      }));
      setRecentActivity(activities);

      // Calculate response rate from blood requests
      const totalRequests = bloodRequestsList.length;
      const fulfilledRequests = bloodRequestsList.filter((req: any) => req.status === 'fulfilled').length;
      const responseRate = totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 0;

      setStats({
        totalHospitals: hospitals.length,
        activeDonors: donorsList.length,
        bloodRequests: totalRequests,
        responseRate: responseRate
      });

    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Dynamic blood group chart data
  const bloodGroupColors: Record<string, string> = {
    'O+': '#ef4444',   // red-500
    'A+': '#3b82f6',   // blue-500
    'B+': '#22c55e',   // green-500
    'AB+': '#eab308',  // yellow-500
    'O-': '#a855f7',   // purple-500
    'A-': '#ec4899',   // pink-500
    'B-': '#6366f1',   // indigo-500
    'AB-': '#6b7280',  // gray-500
  };
  const bloodGroupCounts: Record<string, number> = {};
  donors.forEach(donor => {
    const group = donor.bloodGroup;
    if (group) bloodGroupCounts[group] = (bloodGroupCounts[group] || 0) + 1;
  });
  const bloodGroupData = Object.keys(bloodGroupColors).map(bg => ({
    label: bg,
    value: bloodGroupCounts[bg] || 0,
    color: bloodGroupColors[bg]
  }));

  const responseRateData = [
    { label: 'Responded', value: stats.responseRate, color: '#10b981' },
    { label: 'No Response', value: 100 - stats.responseRate, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <button
          onClick={fetchDashboardStats}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-700 dark:text-red-300">⚠️ {error}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Hospitals"
          value={loading ? '...' : stats.totalHospitals}
          icon={Building2}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatsCard
          title="Active Donors"
          value={loading ? '...' : stats.activeDonors}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
        <StatsCard
          title="Blood Requests"
          value={loading ? '...' : stats.bloodRequests}
          icon={Heart}
          trend={{ value: 5, isPositive: false }}
          color="red"
        />
        <StatsCard
          title="Response Rate"
          value={loading ? '...' : `${stats.responseRate}%`}
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          title="Donors by Blood Group"
          data={bloodGroupData}
          type="bar"
        />
        <Chart
          title="Donor Response Rate"
          data={responseRateData}
          type="pie"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.hospital || activity.donor || activity.request}
                </p>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}