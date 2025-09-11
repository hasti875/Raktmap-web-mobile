import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, X } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { Donor } from '../../types';

interface DonorsListProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DonorsList({ isOpen, onClose }: DonorsListProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchDonors();
    }
  }, [isOpen]);

  const fetchDonors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/donors');
      setDonors(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch donors');
    } finally {
      setLoading(false);
    }
  };

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donor.rollNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBloodGroup = !bloodGroupFilter || donor.bloodGroup === bloodGroupFilter;
    return matchesSearch && matchesBloodGroup;
  });

  const bloodGroups = ['A +', 'A -', 'B +', 'B -', 'AB +', 'AB -', 'O +', 'O -', 'NK'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Donors</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={bloodGroupFilter}
                onChange={(e) => setBloodGroupFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Blood Groups</option>
                {bloodGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading donors...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchDonors}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Donors List */}
          {!loading && !error && (
            <div className="space-y-4">
              {filteredDonors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">No donors found</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredDonors.map((donor) => (
                    <div
                      key={donor._id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {donor.name}
                            </h3>
                            <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full text-sm font-medium">
                              {donor.bloodGroup}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {donor.rollNo && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium mr-2">Roll No:</span>
                                {donor.rollNo}
                              </div>
                            )}
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Mail className="h-4 w-4 mr-2" />
                              {donor.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="h-4 w-4 mr-2" />
                              {donor.phone}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Registered: {new Date(donor.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {!loading && !error && filteredDonors.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredDonors.length} of {donors.length} donors
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 