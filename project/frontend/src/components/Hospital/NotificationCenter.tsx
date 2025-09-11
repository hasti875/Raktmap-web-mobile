import { useState, useEffect } from 'react';
import { Bell, MessageSquare, Heart, CheckCircle, Clock, MoreVertical } from 'lucide-react';
import { Notification } from '../../types';

// Helper function to decode JWT and extract hospital ID
const getHospitalIdFromToken = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // Decode JWT payload (middle part after splitting by dots)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const decoded = JSON.parse(jsonPayload);
    return decoded.id || null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export function NotificationCenter() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hospitalId = getHospitalIdFromToken() || 'demo-hospital'; // extract from JWT

  const fetchNotifications = async () => {
    try {
      setLoading(true); setError(null);
      const res = await fetch(`http://localhost:5000/notifications/${hospitalId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications.map((n: any) => ({
          id: n._id,
          title: n.title,
            message: n.message,
            type: n.type,
            createdAt: n.createdAt,
            read: n.read
        })));
      } else {
        setError(data.message || 'Failed to load');
      }
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);
  // Real-time SSE subscription
  useEffect(() => {
    const source = new EventSource(`http://localhost:5000/notifications/stream/${hospitalId}`);
    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'notification' && data.notification) {
          setNotifications(prev => [
            {
              id: data.notification._id,
              title: data.notification.title,
              message: data.notification.message,
              type: data.notification.type,
              createdAt: data.notification.createdAt,
              read: data.notification.read
            },
            ...prev
          ]);
        }
      } catch {}
    };
    source.onerror = () => { /* silently ignore */ };
    return () => source.close();
  }, [hospitalId]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
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
      case 'sms':
        return notification.title.toLowerCase().includes('sms');
      case 'request':
        return notification.title.toLowerCase().includes('request');
      case 'donor':
        return notification.title.toLowerCase().includes('donor');
      default:
        return true;
    }
  });

  const markAsRead = async (id: string) => {
    setNotifications(n => n.map(notif => notif.id === id ? { ...notif, read: true } : notif));
    try { await fetch(`http://localhost:5000/notifications/${id}/read`, { method: 'POST' }); } catch {}
  };

  const markAllAsRead = async () => {
    setNotifications(n => n.map(notif => ({ ...notif, read: true })));
    try { await fetch(`http://localhost:5000/notifications/${hospitalId}/read-all`, { method: 'POST' }); } catch {}
  };

  // deleteNotification function removed (not used yet)

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchNotifications}
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={markAllAsRead}
            disabled={!notifications.some(n=>!n.read)}
            className="text-sm text-blue-600 disabled:opacity-40 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'sms', label: 'SMS', count: notifications.filter(n => n.title.toLowerCase().includes('sms')).length },
            { key: 'request', label: 'Requests', count: notifications.filter(n => n.title.toLowerCase().includes('request')).length },
            { key: 'donor', label: 'Donors', count: notifications.filter(n => n.title.toLowerCase().includes('donor')).length }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading notifications...</div>
          )}
          {error && !loading && (
            <div className="p-4 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          {!loading && !error && filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`text-sm font-medium ${
                        !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      !notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Mark as read
                    </button>
                  )}
                  <div className="relative">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
            <p className="text-gray-500 dark:text-gray-400">No notifications found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {selectedFilter === 'all' ? 'You\'re all caught up!' : `No ${selectedFilter} notifications`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}