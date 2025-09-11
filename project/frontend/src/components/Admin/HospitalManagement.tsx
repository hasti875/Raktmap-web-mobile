import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye, Trash2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Table } from '../Shared/Table';
import { Modal } from '../Shared/Modal';
import { Hospital } from '../../types';
import axios from '../../utils/axios';

export function HospitalManagement() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add'>('view');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyContact: '',
    address: '',
    radius: 10,
    status: 'pending'
  });

  // Fetch hospitals from API
  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching hospitals from database...');
      const response = await axios.get('/admin/hospitals');
      if (response.data.success) {
        setHospitals(response.data.hospitals);
        console.log('Fetched hospitals:', response.data.hospitals.length);
      } else {
        throw new Error(response.data.message || 'Failed to fetch hospitals');
      }
    } catch (err: any) {
      console.error('Error fetching hospitals:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch hospitals');
    } finally {
      setLoading(false);
    }
  };

  // Fetch hospitals on component mount
  useEffect(() => {
    fetchHospitals();
  }, []);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isModalOpen) {
      if (modalType === 'edit' && selectedHospital) {
        setFormData({
          name: selectedHospital.name,
          email: selectedHospital.email,
          phone: selectedHospital.phone,
          emergencyContact: selectedHospital.emergencyContact,
          address: selectedHospital.address,
          radius: selectedHospital.radius,
          status: selectedHospital.status
        });
      } else if (modalType === 'add') {
        setFormData({
          name: '',
          email: '',
          phone: '',
          emergencyContact: '',
          address: '',
          radius: 10,
          status: 'pending'
        });
      }
    }
  }, [isModalOpen, modalType, selectedHospital]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create hospital
  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null); // Clear any previous errors
      const response = await axios.post('/admin/hospitals', formData);
      if (response.data.success) {
        await fetchHospitals();
        setIsModalOpen(false);
        setSelectedHospital(null);
      }
    } catch (err: any) {
      console.error('Error creating hospital:', err);
      setError(err.response?.data?.message || 'Failed to create hospital');
    }
  };

  // Update hospital
  const handleUpdateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital) return;
    
    try {
      setError(null); // Clear any previous errors
      const hospitalId = selectedHospital._id || selectedHospital.id;
      const response = await axios.put(`/admin/hospitals/${hospitalId}`, formData);
      if (response.data.success) {
        await fetchHospitals();
        setIsModalOpen(false);
        setSelectedHospital(null);
      }
    } catch (err: any) {
      console.error('Error updating hospital:', err);
      setError(err.response?.data?.message || 'Failed to update hospital');
    }
  };

  // Delete hospital
  const handleDeleteHospital = async (hospitalId: string) => {
    if (!confirm('Are you sure you want to delete this hospital?')) return;
    
    try {
      setError(null); // Clear any previous errors
      const response = await axios.delete(`/admin/hospitals/${hospitalId}`);
      if (response.data.success) {
        await fetchHospitals();
      }
    } catch (err: any) {
      console.error('Error deleting hospital:', err);
      setError(err.response?.data?.message || 'Failed to delete hospital');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'suspended':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const columns = [
    { key: 'name' as keyof Hospital, label: 'Hospital Name' },
    { key: 'email' as keyof Hospital, label: 'Email' },
    { key: 'phone' as keyof Hospital, label: 'Phone' },
    {
      key: 'status' as keyof Hospital,
      label: 'Status',
      render: (status: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
          <span className="ml-1 capitalize">{status}</span>
        </span>
      ),
    },
    {
      key: 'id' as keyof Hospital,
      label: 'Actions',
      render: (_: any, hospital: Hospital) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedHospital(hospital);
              setModalType('view');
              setIsModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedHospital(hospital);
              setModalType('edit');
              setIsModalOpen(true);
            }}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteHospital(hospital._id || hospital.id)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    hospital.email.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hospital Management</h2>
          {!loading && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {hospitals.length} hospitals found
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchHospitals}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setSelectedHospital(null);
              setModalType('add');
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Hospital</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading hospitals...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-700 dark:text-red-300">Error: {error}</span>
          </div>
          <button
            onClick={() => {
              setError(null);
              fetchHospitals();
            }}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data Table */}
      {!loading && hospitals.length > 0 && (
        <Table
          data={filteredHospitals}
          columns={columns}
          searchable
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'add' ? 'Add Hospital' : modalType === 'edit' ? 'Edit Hospital' : 'Hospital Details'}
        size="lg"
      >
        {selectedHospital && modalType === 'view' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <p className="text-gray-900 dark:text-white">{selectedHospital.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-gray-900 dark:text-white">{selectedHospital.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <p className="text-gray-900 dark:text-white">{selectedHospital.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emergency Contact</label>
                <p className="text-gray-900 dark:text-white">{selectedHospital.emergencyContact}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <p className="text-gray-900 dark:text-white">{selectedHospital.address}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Radius</label>
                <p className="text-gray-900 dark:text-white">{selectedHospital.radius} km</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedHospital.status)}`}>
                  {getStatusIcon(selectedHospital.status)}
                  <span className="ml-1 capitalize">{selectedHospital.status}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {(modalType === 'edit' || modalType === 'add') && (
          <form onSubmit={modalType === 'add' ? handleCreateHospital : handleUpdateHospital} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hospital Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emergency Contact</label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Radius (km)</label>
                <input
                  type="number"
                  name="radius"
                  value={formData.radius}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                {modalType === 'add' ? 'Add Hospital' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}