import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const getHospitalIdFromToken = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    // Only return ID if user is a hospital
    return decoded.role === 'hospital' ? decoded.id : null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const hospitalId = getHospitalIdFromToken();
    if (!hospitalId) {
      console.log('No hospital ID found, skipping SSE connection');
      return;
    }

    console.log('🔌 Establishing SSE connection for hospital:', hospitalId);
    const source = new EventSource(`http://localhost:5000/notifications/stream/${hospitalId}`);

    source.onopen = () => {
      console.log('✅ SSE Connection opened');
      setIsConnected(true);
    };

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 SSE Message received:', data);

        if (data.type === 'hello') {
          console.log('👋 SSE Hello message received');
          return;
        }

        if (data.type === 'notification' && data.notification) {
          const notif = data.notification;

          // Add to notifications list
          setNotifications((prev) => [notif, ...prev]);

          // Show toast notification
          toast.success(
            <div>
              <strong>{notif.title}</strong>
              <p className="text-sm mt-1">{notif.message}</p>
            </div>,
            {
              position: 'top-right',
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );

          // Play notification sound
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => console.log('Could not play sound'));

          // Trigger custom event for components that need to refresh
          window.dispatchEvent(new CustomEvent('bloodRequestUpdate'));
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    source.onerror = (error) => {
      console.error('❌ SSE Connection error:', error);
      setIsConnected(false);
      // EventSource will automatically reconnect
    };

    // Cleanup on unmount
    return () => {
      console.log('🔌 Closing SSE connection');
      source.close();
      setIsConnected(false);
    };
  }, []); // Empty dependency array - only create connection once

  const markAsRead = useCallback(async (id: string) => {
    // Update local state immediately for better UX
    setNotifications((prev) =>
      prev.map((notif) => (notif._id === id ? { ...notif, read: true } : notif))
    );
    
    // Persist to backend
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to mark notification as read on server');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const hospitalId = getHospitalIdFromToken();
    if (!hospitalId) return;
    
    // Update local state immediately
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    
    // Persist to backend
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/notifications/${hospitalId}/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to mark all notifications as read on server');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
