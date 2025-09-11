import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../contexts/AuthContext';

// Import all dashboard section components
import { AdminDashboard } from '../Admin/AdminDashboard';
import { HospitalManagement } from '../Admin/HospitalManagement';
import { DonorManagement } from '../Admin/DonorManagement';
import { BloodRequestManagement } from '../Admin/BloodRequestManagement';
import { HospitalDashboard } from '../Hospital/HospitalDashboard';
import { BloodRequestForm } from '../Hospital/BloodRequestForm';
import { AvailableDonors } from '../Hospital/AvailableDonors';
import { LiveMap } from '../Hospital/LiveMap';
import { DonationHistory } from '../Hospital/DonationHistory';
import { SearchDonors } from '../Hospital/SearchDonors';
import { NotificationCenter } from '../Hospital/NotificationCenter';
import { HospitalSettings } from '../Hospital/HospitalSettings';
import { Analytics } from '../Admin/Analytics';
import { LiveDonorMap } from '../Admin/LiveDonorMap';
import { Notifications as AdminNotifications } from '../Admin/Notifications';
import { AccessControl } from '../Admin/AccessControl';
import { AuditLogs } from '../Admin/AuditLogs';
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
        case 'donors':
          return <DonorManagement />;
        case 'requests':
          return <BloodRequestManagement />;
        case 'map':
          return <LiveDonorMap />;
        case 'analytics':
          return <Analytics />;
        case 'notifications':
          return <AdminNotifications />;
        case 'access-control':
          return <AccessControl />;
        case 'audit':
          return <AuditLogs />;
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
          return <BloodRequestForm />;
        case 'donors':
          return <AvailableDonors />;
        case 'map':
          return <LiveMap />;
        case 'history':
          return <DonationHistory />;
        case 'search':
          return <SearchDonors />;
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