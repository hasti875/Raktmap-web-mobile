import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../contexts/AuthContext';

// Import all dashboard section components
import { AdminDashboard } from '../Admin/AdminDashboard';
import { HospitalManagement } from '../Admin/HospitalManagement';
import { HospitalDashboard } from '../Hospital/HospitalDashboard';
import { BloodRequestForm } from '../Hospital/BloodRequestForm';
import { AvailableDonors } from '../Hospital/AvailableDonors';
import { LiveMap } from '../Hospital/LiveMap';
import { DonationHistory } from '../Hospital/DonationHistory';
import { SearchDonors } from '../Hospital/SearchDonors';
import { NotificationCenter } from '../Hospital/NotificationCenter';
import { HospitalSettings } from '../Hospital/HospitalSettings';
import { BloodStockManagement } from '../Hospital/BloodStockManagement';
import { MarkDonation } from '../Admin/MarkDonation';
import { Notifications as AdminNotifications } from '../Admin/Notifications';
import { AdminSettings } from '../Admin/AdminSettings';

const MainLayout: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const { user } = useAuth();

  // Render the correct section based on user role and activeSection
  const renderContent = () => {
    if (user?.role === 'admin') {
      switch (activeSection) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'hospitals':
          return <HospitalManagement />;
        case 'notifications':
          return <AdminNotifications />;
        case 'settings':
          return <AdminSettings />;
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (activeSection) {
        case 'dashboard':
          return <HospitalDashboard onNavigate={setActiveSection} />;
        case 'request-blood':
          return <BloodRequestForm onSuccess={() => setActiveSection('dashboard')} />;
        case 'donors':
          return <AvailableDonors />;
        case 'mark-donation':
          return <MarkDonation />;
        case 'map':
          return <LiveMap />;
        case 'history':
          return <DonationHistory />;
        case 'search':
          return <SearchDonors />;
        case 'blood-stock':
          return <BloodStockManagement />;
        case 'notifications':
          return <NotificationCenter />;
        case 'settings':
          return <HospitalSettings />;
        // Add other hospital sections as needed
        default:
          return <HospitalDashboard />;
      }
    }
  };


  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;