import React, { useState, useEffect } from 'react';
import { Heart, Eye, Filter, Calendar, Building2 } from 'lucide-react';
import { Table } from '../Shared/Table';
import { Modal } from '../Shared/Modal';
import { BloodRequest, Hospital } from '../../types';
import axios from '../../utils/axios';

export function BloodRequestManagement() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [reqRes, hospRes] = await Promise.all([
          axios.get('/blood-requests/all'),
          axios.get('/hospitals/')
        ]);
        // Map backend _id to id for frontend compatibility
        const requests = (reqRes.data.bloodRequests || []).map((r: any) => ({
          ...r,
          id: r._id || r.id,
          donorResponses: r.donorResponses || [],
          requestedAt: r.createdAt || r.requestedAt
        }));
        setBloodRequests(requests);
        setHospitals(hospRes.data.hospitals || []);
      } catch (err: any) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'fulfilled':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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

  const getHospitalName = (hospitalId: string) => {
    return hospitals.find(h => h.id === hospitalId)?.name || 'Unknown Hospital';
  };

  const columns = [
    { key: 'id' as keyof BloodRequest, label: 'Request ID' },
    {
      key: 'hospitalId' as keyof BloodRequest,
      label: 'Hospital',
      render: (hospitalId: string) => getHospitalName(hospitalId)
    },
    { key: 'bloodGroup' as keyof BloodRequest, label: 'Blood Group' },
    {
      key: 'quantity' as keyof BloodRequest,
      label: 'Quantity',
      render: (quantity: number) => `${quantity} units`
    },
    {
      key: 'urgency' as keyof BloodRequest,
      label: 'Urgency',
      render: (urgency: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(urgency)}`}>
          {urgency}
        </span>
      )
    },
    {
      key: 'status' as keyof BloodRequest,
      label: 'Status',
      render: (status: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {status}
        </span>
      )
    },
    {
      key: 'requestedAt' as keyof BloodRequest,
      label: 'Requested',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      key: 'donorResponses' as keyof BloodRequest,
      label: 'Responses',
      render: (responses: any[]) => `${responses.length} donors`
    },
    {
      key: 'id' as keyof BloodRequest,
      label: 'Actions',
      render: (_: any, request: BloodRequest) => (
        <button
          onClick={() => {
            setSelectedRequest(request);
            setIsModalOpen(true);
          }}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <Eye className="h-4 w-4" />
        </button>
      )
    }
  ];

  const filteredRequests = bloodRequests.filter(request => {
    const matchesSearch = request.id?.toLowerCase().includes(searchValue.toLowerCase()) ||
      request.bloodGroup?.toLowerCase().includes(searchValue.toLowerCase()) ||
      getHospitalName(request.hospitalId)?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = !selectedStatus || request.status === selectedStatus;
    const matchesHospital = !selectedHospital || request.hospitalId === selectedHospital;
    let matchesDateRange = true;
    if (dateRange.start && dateRange.end) {
      // Both from and to are set: filter inclusively
      const requestDate = new Date(request.requestedAt);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      // Set endDate to end of the day for inclusivity
      endDate.setHours(23, 59, 59, 999);
      matchesDateRange = requestDate >= startDate && requestDate <= endDate;
    } else if (dateRange.start) {
      // Only from date is set
      const requestDate = new Date(request.requestedAt);
      const startDate = new Date(dateRange.start);
      matchesDateRange = requestDate >= startDate;
    } else if (dateRange.end) {
      // Only to date is set
      const requestDate = new Date(request.requestedAt);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      matchesDateRange = requestDate <= endDate;
    }
    return matchesSearch && matchesStatus && matchesHospital && matchesDateRange;
  });

  const stats = {
    total: bloodRequests.length,
    pending: bloodRequests.filter(r => r.status === 'pending').length,
    fulfilled: bloodRequests.filter(r => r.status === 'fulfilled').length,
    cancelled: bloodRequests.filter(r => r.status === 'cancelled').length
  };

  if (loading) return <div className="p-8 text-center">Loading blood requests...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Blood Request Management</h2>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Heart className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-yellow-500"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fulfilled</p>
              <p className="text-2xl font-bold text-green-600">{stats.fulfilled}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-500"></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hospital</label>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Hospitals</option>
              {hospitals.map(hospital => (
                <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedStatus('');
                setSelectedHospital('');
                setDateRange({ start: '', end: '' });
                setSearchValue('');
              }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <Table
        data={filteredRequests}
        columns={columns}
        searchable
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      {/* Request Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Blood Request Details"
        size="xl"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Request ID</label>
                  <p className="text-gray-900 dark:text-white font-mono">{selectedRequest.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hospital</label>
                  <p className="text-gray-900 dark:text-white">{getHospitalName(selectedRequest.hospitalId)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Blood Group</label>
                  <p className="text-gray-900 dark:text-white font-bold text-red-600">{selectedRequest.bloodGroup}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                  <p className="text-gray-900 dark:text-white">{selectedRequest.quantity} units</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Urgency</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(selectedRequest.urgency)}`}>
                    {selectedRequest.urgency}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Requested At</label>
                  <p className="text-gray-900 dark:text-white">{new Date(selectedRequest.requestedAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Required By</label>
                  <p className="text-gray-900 dark:text-white">{new Date(selectedRequest.requiredBy).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {selectedRequest.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {selectedRequest.description}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Donor Responses ({selectedRequest.donorResponses.length})
              </label>
              {selectedRequest.donorResponses.length > 0 ? (
                <div className="space-y-2">
                  {selectedRequest.donorResponses.map((response, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-900 dark:text-white">Donor ID: {response.donorId}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(response.status)}`}>
                          {response.status}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(response.respondedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No donor responses yet</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}