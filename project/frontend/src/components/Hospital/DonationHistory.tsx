import { useState, useEffect } from 'react';
import { History, Download, Filter, FileText, Loader } from 'lucide-react';
import { Table } from '../Shared/Table';
import axiosInstance from '../../utils/axios';

interface DonationRecord {
  _id: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorBloodGroup: string;
  status: 'accepted' | 'declined' | 'pending' | 'completed';
  acceptedAt?: string;
  completedAt?: string;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export function DonationHistory() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch donation history from backend
  useEffect(() => {
    fetchDonationHistory();
  }, []);

  const fetchDonationHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from the donation history endpoint
      const response = await axiosInstance.get('/donation-history/donation-history');
      
      if (response.data.success) {
        // Use the donation history data directly
        setDonations(response.data.donationHistory);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch donation history');
      }
    } catch (err: any) {
      console.error('Error fetching donation history:', err);
      setError(err.response?.data?.message || 'Failed to fetch donation history');
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const statuses = ['accepted', 'declined', 'pending', 'completed'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const columns = [
    {
      key: 'createdAt' as keyof DonationRecord,
      label: 'Date',
      render: (createdAt: string) => (
        <div className="text-sm">
          {new Date(createdAt).toLocaleDateString()}
        </div>
      )
    },
    { 
      key: 'donorBloodGroup' as keyof DonationRecord, 
      label: 'Blood Group',
      render: (bloodGroup: string) => (
        <span className="font-semibold text-red-600 dark:text-red-400">
          {bloodGroup}
        </span>
      )
    },
    { 
      key: 'donorName' as keyof DonationRecord, 
      label: 'Donor',
      render: (name: string, record: DonationRecord) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">{name || 'N/A'}</div>
          <div className="text-gray-500 dark:text-gray-400">{record.donorPhone || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'acceptedAt' as keyof DonationRecord,
      label: 'Accepted',
      render: (acceptedAt: string) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {acceptedAt ? new Date(acceptedAt).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'completedAt' as keyof DonationRecord,
      label: 'Completed',
      render: (completedAt: string) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {completedAt ? new Date(completedAt).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    { 
      key: 'address' as keyof DonationRecord, 
      label: 'Location',
      render: (address: string) => (
        <div className="text-sm max-w-xs">
          <div className="truncate" title={address || 'N/A'}>
            {address || 'N/A'}
          </div>
        </div>
      )
    },
    {
      key: 'status' as keyof DonationRecord,
      label: 'Status',
      render: (status: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(status)}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      )
    }
  ];

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = (donation.donorName || '').toLowerCase().includes(searchValue.toLowerCase()) ||
                         donation.donorBloodGroup.toLowerCase().includes(searchValue.toLowerCase());
    const matchesBloodGroup = !selectedBloodGroup || donation.donorBloodGroup === selectedBloodGroup;
    const matchesStatus = !selectedStatus || donation.status === selectedStatus;
    
    return matchesSearch && matchesBloodGroup && matchesStatus;
  });

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting ${format.toUpperCase()}...`);
    // Handle export functionality
  };

  const stats = {
    total: donations.length,
    completed: donations.filter(d => d.status === 'completed').length,
    declined: donations.filter(d => d.status === 'declined').length,
    accepted: donations.filter(d => d.status === 'accepted').length
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="h-12 w-12 text-red-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading donation history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchDonationHistory}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Donation History</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={fetchDonationHistory}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <History className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex-1 sm:flex-none"
            >
              <FileText className="h-4 w-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 lg:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <History className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 lg:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xl lg:text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 lg:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Declined</p>
              <p className="text-xl lg:text-2xl font-bold text-red-600">{stats.declined}</p>
            </div>
            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✕</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 lg:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">Accepted</p>
              <p className="text-xl lg:text-2xl font-bold text-blue-600">{stats.accepted}</p>
            </div>
            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">🩸</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
            <select
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="">All Groups</option>
              {bloodGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedBloodGroup('');
                setSelectedStatus('');
                setSearchValue('');
              }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 text-sm"
            >
              <Filter className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredDonations.length === 0 ? (
        <div className="text-center py-12">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No donation records found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adjusting your search filters</p>
        </div>
      ) : (
        <Table
          data={filteredDonations}
          columns={columns}
          searchable
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      )}
    </div>
  );
}