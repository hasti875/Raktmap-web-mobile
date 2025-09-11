import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, MessageSquare, Heart, Clock, MoreVertical, RefreshCw, Users, Building2 } from 'lucide-react';
import axios from '../../utils/axios';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  createdAt: string;
  read: boolean;
  category: 'system' | 'hospital' | 'donor' | 'blood-request';
  relatedId?: string;
}

export function Notifications() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Generate mock admin notifications for demonstration
  const generateMockNotifications = (): AdminNotification[] => {
    const mockData: AdminNotification[] = [
      {
        id: '1',
        title: 'New Hospital Registration',
        message: 'Metro General Hospital has submitted a registration request and is awaiting approval.',
        type: 'info',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
        read: false,
        category: 'hospital'
      },
      {
        id: '2',
        title: 'Blood Request Fulfilled',
        message: 'Emergency blood request for O+ blood type has been successfully fulfilled at City Hospital.',
        type: 'success',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
        read: false,
        category: 'blood-request'
      },
      {
        id: '3',
        title: 'Low Donor Response Rate',
        message: 'Donor response rate has dropped below 60% for blood requests in the last 24 hours.',
        type: 'warning',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        read: true,
        category: 'system'
      },
      {
        id: '4',
        title: 'New Donor Registrations',
        message: '25 new donors have registered in the last hour, bringing total active donors to 1,247.',
        type: 'success',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
        read: true,
        category: 'donor'
      },
      {
        id: '5',
        title: 'System Maintenance Alert',
        message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM. SMS services may be temporarily unavailable.',
        type: 'warning',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        read: true,
        category: 'system'
      },
      {
        id: '6',
        title: 'Hospital Account Suspended',
        message: 'Valley Medical Center account has been suspended due to policy violations.',
        type: 'error',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        read: true,
        category: 'hospital'
      },
      {
        id: '7',
        title: 'Urgent Blood Request',
        message: 'Critical blood request for AB- blood type has been posted by Emergency Hospital.',
        type: 'error',
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        read: true,
        category: 'blood-request'
      },
      {
        id: '8',
        title: 'Database Backup Completed',
        message: 'Daily database backup has been successfully completed at 3:00 AM.',
        type: 'success',
        createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
        read: true,
        category: 'system'
      }
    ];
    return mockData;
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching admin notifications from database...');
      
      const response = await axios.get('/admin/notifications');
      
      if (response.data.success) {
        setNotifications(response.data.notifications);
        console.log('Fetched notifications:', response.data.notifications.length);
      } else {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }
      
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch notifications');
      
      // Fallback to mock data only if there's an error
      const mockNotifications = generateMockNotifications();
      setNotifications(mockNotifications);
      console.log('Using fallback mock data due to error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hospital':
        return <Building2 className="h-4 w-4" />;
      case 'donor':
        return <Users className="h-4 w-4" />;
      case 'blood-request':
        return <Heart className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (selectedFilter) {
      case 'unread':
        return !notification.read;
      case 'system':
        return notification.category === 'system';
      case 'hospital':
        return notification.category === 'hospital';
      case 'donor':
        return notification.category === 'donor';
      case 'blood-request':
        return notification.category === 'blood-request';
      default:
        return true;
    }
  });

  const markAsRead = async (id: string) => {
    setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif));
    
    try {
      const response = await axios.post(`/admin/notifications/${id}/read`);
      if (!response.data.success) {
        console.error('Failed to mark notification as read:', response.data.message);
        // Revert the optimistic update
        setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: false } : notif));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert the optimistic update
      setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: false } : notif));
    }
  };

  const markAllAsRead = async () => {
    const previousNotifications = [...notifications];
    setNotifications(n => n.map(notif => ({ ...notif, read: true })));
    
    try {
      const response = await axios.post('/admin/notifications/read-all');
      if (!response.data.success) {
        console.error('Failed to mark all notifications as read:', response.data.message);
        // Revert the optimistic update
        setNotifications(previousNotifications);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert the optimistic update
      setNotifications(previousNotifications);
    }
  };

  // Seed sample notifications for testing
  const seedNotifications = async () => {
    try {
      setSeeding(true);
      const response = await axios.post('/admin/notifications/seed');
      
      if (response.data.success) {
        console.log('Sample notifications seeded successfully');
        // Refresh the notifications list
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error seeding notifications:', error);
    } finally {
      setSeeding(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={seedNotifications}
            disabled={seeding}
            className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <span>{seeding ? 'Seeding...' : 'Seed Sample Data'}</span>
          </button>
          <button
            onClick={markAllAsRead}
            disabled={!notifications.some(n => !n.read)}
            className="text-sm text-red-600 disabled:opacity-40 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 shadow-lg dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'system', label: 'System', count: notifications.filter(n => n.category === 'system').length },
            { key: 'hospital', label: 'Hospitals', count: notifications.filter(n => n.category === 'hospital').length },
            { key: 'donor', label: 'Donors', count: notifications.filter(n => n.category === 'donor').length },
            { key: 'blood-request', label: 'Blood Requests', count: notifications.filter(n => n.category === 'blood-request').length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedFilter === filter.key
                  ? 'border-red-600 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading && (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Loading notifications...
            </div>
          )}
          
          {error && !loading && (
            <div className="p-6 text-center">
              <div className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</div>
              <button
                onClick={fetchNotifications}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          )}
          
          {!loading && !error && filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 border-l-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${getNotificationColor(notification.type)} ${
                !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`text-sm font-semibold ${
                        !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      )}
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        {getCategoryIcon(notification.category)}
                        <span className="capitalize">{notification.category.replace('-', ' ')}</span>
                      </div>
                    </div>
                    <p className={`text-sm mt-1 leading-relaxed ${
                      !notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Mark as read
                    </button>
                  )}
                  <div className="relative">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {selectedFilter === 'all' ? 'You\'re all caught up!' : `No ${selectedFilter.replace('-', ' ')} notifications`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}