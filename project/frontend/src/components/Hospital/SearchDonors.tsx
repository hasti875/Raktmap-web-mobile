import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Calendar, Filter, Grid, List, Loader, Mail } from 'lucide-react';
import { Donor } from '../../types';
import axiosInstance from '../../utils/axios';

export function SearchDonors() {
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    bloodGroup: ''
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch donors from database
  useEffect(() => {
    fetchDonors();
  }, []);

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

  const bloodGroups = ['A +', 'A -', 'B +', 'B -', 'AB +', 'AB -', 'O +', 'O -', 'NK'];

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         donor.email.toLowerCase().includes(searchValue.toLowerCase()) ||
                         donor.rollNo?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesBloodGroup = !filters.bloodGroup || donor.bloodGroup === filters.bloodGroup;
    
    return matchesSearch && matchesBloodGroup;
  });

  const DonorCard = ({ donor }: { donor: Donor }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{donor.name}</h3>
          {donor.rollNo && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Roll No: {donor.rollNo}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-red-600 dark:text-red-400">{donor.bloodGroup}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Mail className="h-4 w-4 mr-2" />
          <span>{donor.email}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Phone className="h-4 w-4 mr-2" />
          <span>{donor.phone}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Registered: {new Date(donor.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          Contact
        </button>
        <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
          Request
        </button>
      </div>
    </div>
  );

  const DonorListItem = ({ donor }: { donor: Donor }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <span className="text-red-600 dark:text-red-400 font-bold">{donor.bloodGroup}</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{donor.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              {donor.rollNo && <span>Roll No: {donor.rollNo}</span>}
              <span>•</span>
              <span>{donor.email}</span>
              <span>•</span>
              <span>{donor.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
              Contact
            </button>
            <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
              Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Search Donors</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{filteredDonors.length} donors found</span>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-600 dark:text-gray-400'} rounded-l-lg transition-colors`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-600 dark:text-gray-400'} rounded-r-lg transition-colors`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, email, or roll number..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <select
            value={filters.bloodGroup}
            onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">All Blood Groups</option>
            {bloodGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFilters({ bloodGroup: '' });
              setSearchValue('');
            }}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader className="h-12 w-12 text-red-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading donors...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchDonors}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDonors.map((donor) => (
                <DonorCard key={donor._id} donor={donor} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDonors.map((donor) => (
                <DonorListItem key={donor._id} donor={donor} />
              ))}
            </div>
          )}

          {filteredDonors.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No donors found matching your criteria</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Try adjusting your search filters</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}