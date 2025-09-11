import { 
  Home, Users, Building2, Heart, Settings, Bell, 
  Map, BarChart3, History, Shield, FileText, Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const { user } = useAuth();

  const adminSections = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'hospitals', label: 'Manage Hospitals', icon: Building2 },
    { id: 'donors', label: 'Manage Donors', icon: Users },
    { id: 'requests', label: 'Blood Requests', icon: Heart },
    { id: 'map', label: 'Live Donor Map', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'access-control', label: 'Access Control', icon: Shield },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const hospitalSections = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'request-blood', label: 'Request Blood', icon: Heart },
    { id: 'donors', label: 'Available Donors', icon: Users },
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'history', label: 'Donation History', icon: History },
    { id: 'search', label: 'Search Donors', icon: Search },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sections = user?.role === 'admin' ? adminSections : hospitalSections;

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Heart className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">RaktMap</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role} Panel</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeSection === id
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}