import { useState, useEffect } from 'react';
import { Users, MapPin, Phone, Calendar, Search, CheckCircle, X, RefreshCw } from 'lucide-react';
import { Donor } from '../../types';
import axios from 'axios';

interface DonorWithLocation extends Donor {
  rollNo?: string;
  location?: {
    lat: number;
    lng: number;
  };
  responseTime?: string;
  detailedStatus?: string;
  hasLocationData?: boolean;
  matchedBy?: string;
}

interface BloodRequest {
  _id: string;
  bloodGroup: string;
  quantity: number;
  urgency: string;
  status: string;
  createdAt: string;
}

export function AvailableDonors() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<string>('all'); // Only blood request filter
  const [donors, setDonors] = useState<DonorWithLocation[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [completedDonations, setCompletedDonations] = useState<Set<string>>(new Set()); // Track completed donations by donorId
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blood group compatibility function
  const getCompatibleBloodGroups = (requestedBloodGroup: string): string[] => {
    // This returns which donor blood groups can give to the requested blood group
    const compatibility: { [key: string]: string[] } = {
      'A+': ['A+', 'A-', 'O+', 'O-'],        // A+ can receive from A+, A-, O+, O-
      'A-': ['A-', 'O-'],                     // A- can receive from A-, O-
      'B+': ['B+', 'B-', 'O+', 'O-'],        // B+ can receive from B+, B-, O+, O-
      'B-': ['B-', 'O-'],                     // B- can receive from B-, O-
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // AB+ can receive from everyone (universal recipient)
      'AB-': ['A-', 'B-', 'AB-', 'O-'],      // AB- can receive from A-, B-, AB-, O-
      'O+': ['O+', 'O-'],                     // O+ can receive from O+, O-
      'O-': ['O-']                            // O- can only receive from O- (universal donor to others, but restrictive recipient)
    };
    
    return compatibility[requestedBloodGroup] || [];
  };

  // Fetch blood requests from hospital
  const fetchBloodRequests = async () => {
    try {
      console.log('=== FETCHING BLOOD REQUESTS FOR AVAILABLE DONORS ===');
      const response = await axios.get('http://localhost:5000/blood-requests/hospital', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Blood requests response:', response.data);
      
      if (response.data.success) {
        // Add "All Donors" as first option
        const allDonorsOption: BloodRequest = {
          _id: 'all',
          bloodGroup: 'All Donors',
          quantity: 0,
          urgency: 'info',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        
        const updatedRequests = [allDonorsOption, ...response.data.bloodRequests];
        setBloodRequests(updatedRequests);
      }
    } catch (error: any) {
      console.error('Error fetching blood requests:', error);
      // Fallback to mock data for development with test requests
      const mockRequests: BloodRequest[] = [
        {
          _id: 'all',
          bloodGroup: 'All Donors',
          quantity: 0,
          urgency: 'info',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        // Add test requests to demonstrate filtering
        {
          _id: 'test-o-negative',
          bloodGroup: 'O-',
          quantity: 1,
          urgency: 'high',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'test-a-positive',
          bloodGroup: 'A+',
          quantity: 2,
          urgency: 'medium',
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'test-b-negative',
          bloodGroup: 'B-',
          quantity: 1,
          urgency: 'low',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];
      setBloodRequests(mockRequests);
    }
  };

  // Fetch completed donations (all donors who have ever donated)
  const fetchCompletedDonations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/donation-history/donation-history');
      if (response.data.success) {
        // Get all donors who have completed ANY donation (regardless of request)
        const completedDonorIds = response.data.donationHistory
          .filter((donation: any) => 
            donation.status === 'completed' || donation.status === 'accepted'
          )
          .map((donation: any) => donation.donorId as string);
        
        // Remove duplicates and create a Set
        const uniqueDonorIds = [...new Set(completedDonorIds)];
        setCompletedDonations(new Set(uniqueDonorIds as string[]));
      }
    } catch (error) {
      console.error('Error fetching completed donations:', error);
    }
  };

  // Fetch donors from API
  const fetchDonors = async () => {
    try {
      setError(null);
      const response = await axios.get('http://localhost:5000/donor-response/available-donors');
      if (response.data.success) {
        setDonors(response.data.donors);
      } else {
        throw new Error(response.data.message || 'Failed to fetch donors');
      }
    } catch (err: any) {
      console.error('Error fetching donors:', err);
      setError(err.message || 'Failed to fetch donors');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch donors on component mount and blood requests
  useEffect(() => {
    const initializeData = async () => {
      await fetchBloodRequests();
      await fetchDonors();
      await fetchCompletedDonations();
    };
    initializeData();
  }, []);

  // Refresh donors
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDonors();
  };

  const getStatusColor = (status: string, hasLocation?: boolean, distance?: number) => {
    if (hasLocation) {
      if (distance !== null && distance !== undefined) {
        if (distance <= 5) {
          return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        } else {
          return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
        }
      }
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    
    switch (status) {
      case 'available':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'responded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'unavailable':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusLabel = (donor: DonorWithLocation) => {
    if (donor.hasLocationData) {
      if (donor.distance !== null && donor.distance !== undefined) {
        if (donor.distance <= 5) {
          return 'Near & Ready';
        } else {
          return 'Far but Available';
        }
      }
      return 'Location Shared';
    }
    return 'Not Contacted';
  };

  const filteredDonors = donors.filter(donor => {
    // Filter out donors who have already donated
    if (completedDonations.has(donor._id || donor.id || '')) {
      return false;
    }
    
    // Basic search filter
    const matchesSearch = donor.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         donor.rollNo?.toLowerCase().includes(searchValue.toLowerCase()) ||
                         donor.phone.toLowerCase().includes(searchValue.toLowerCase());
    // Response filtering based on selected request
    let shouldShowDonor = true;
    if (selectedRequest === 'all') {
      // "All Donors" - show only donors who have shared location
      shouldShowDonor = donor.hasLocationData === true;
    } else {
      // Specific blood request selected - ONLY show donors who have responded
      const hasResponded = donor.hasLocationData === true;
      // Blood request compatibility filtering - ONLY for responded donors
      let matchesBloodRequest = true;
      const selectedBloodRequest = bloodRequests.find(req => req._id === selectedRequest);
      if (selectedBloodRequest) {
        const compatibleGroups = getCompatibleBloodGroups(selectedBloodRequest.bloodGroup);
        const donorBloodGroup = donor.bloodGroup?.replace(/\s+/g, '') || 'Unknown'; // Normalize spaces
        matchesBloodRequest = compatibleGroups.includes(donorBloodGroup);
      }
      // For specific requests: must have responded AND be blood compatible
      shouldShowDonor = hasResponded && matchesBloodRequest;
    }
    // Must match search AND meet the response/request criteria
    return matchesSearch && shouldShowDonor;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Donors</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{loading ? 'Loading...' : `${filteredDonors.length} found`}</span>
            </div>
            {!loading && (
              <>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{donors.filter(d => d.hasLocationData).length} responded</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>{donors.filter(d => !d.hasLocationData).length} not contacted</span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <X className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Loading donors...</span>
          </div>
        </div>
      )}

      {/* Search and Blood Request Filter - SIMPLIFIED */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name, roll no, or phone..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Blood Request Filter - ONLY FILTER */}
          <select
            value={selectedRequest}
            onChange={(e) => setSelectedRequest(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {bloodRequests.map((request) => (
              <option key={request._id} value={request._id}>
                {request._id === 'all' ? 'All Donors' : `${request.bloodGroup} - ${new Date(request.createdAt).toLocaleDateString()}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Donor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDonors.map((donor) => (
          <div key={donor.email || donor.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{donor.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {donor.rollNo ? `Roll No: ${donor.rollNo}` : 'No roll number'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-red-600 dark:text-red-400">{donor.bloodGroup}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donor.status || '', donor.hasLocationData, donor.distance)}`}>
                  {getStatusLabel(donor)}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {donor.distance !== null && donor.distance !== undefined && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{donor.distance.toFixed(1)}km away</span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4 mr-2" />
                <span>{donor.phone}</span>
              </div>
              {donor.address && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span className="truncate">{donor.address}</span>
                </div>
              )}
              {donor.responseTime && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Responded: {new Date(donor.responseTime).toLocaleDateString()}</span>
                </div>
              )}
              {donor.hasLocationData && donor.matchedBy && (
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>Matched by {donor.matchedBy}</span>
                </div>
              )}
              {!donor.location && (
                <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                  <X className="h-4 w-4 mr-2" />
                  <span>Location not shared</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDonors.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No donors found matching your criteria</p>
        </div>
      )}
    </div>
  );
}

export default AvailableDonors;