import React, { useState, useEffect } from 'react';
import { MapPin, Users, Filter, RefreshCw, Navigation, Maximize, X, CheckCircle } from 'lucide-react';
import { CharusatMap } from '../Hospital/CharusatMap';
import axios from 'axios';

interface DonorResponse {
  _id: string;
  requestId?: string;
  name: string;
  phone: string;
  donorId: string;
  bloodGroup?: string;
  location: {
    lat: number;
    lng: number;
  };
  status: string;
  responseTime: string;
  address?: string;
}

interface BloodRequest {
  _id: string;
  bloodGroup: string;
  quantity: number;
  urgency: string;
  status: string;
  createdAt: string;
}

export function LiveMap() {
  const [radiusFilter, setRadiusFilter] = useState(50); // Increased default radius
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<string>('all-locations'); // Set default
  const [donorResponses, setDonorResponses] = useState<DonorResponse[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [markingDonation, setMarkingDonation] = useState<string | null>(null); // Track which donor is being marked
  const [completedDonations, setCompletedDonations] = useState<Set<string>>(new Set()); // Track completed donations by donorId only

  // Hospital location (Charusat University) - UPDATED TO CORRECT COORDINATES
  const hospitalLocation = { lat: 22.6013, lng: 72.8327 };

  // Mark donation as completed
  const markDonationCompleted = async (donor: DonorResponse) => {
    try {
      setMarkingDonation(donor._id);
      
      const requestData = {
        donorId: donor.donorId,
        requestId: selectedRequest,
        donorName: donor.name,
        donorPhone: donor.phone,
        donorBloodGroup: donor.bloodGroup,
        location: donor.location,
        address: donor.address
      };
      
      console.log('Sending donation completion request:', requestData);
      
      const response = await axios.post('http://localhost:5000/donation-history/mark-donation-completed', requestData);

      console.log('Donation completion response:', response.data);

      if (response.data.success) {
        // Add this donor to completed donations (only donorId, not request-specific)
        setCompletedDonations(prev => new Set([...prev, donor.donorId]));
        
        alert(`Donation completed successfully for ${donor.name}!`);
        // Optionally refresh the data or update UI state
      } else {
        console.error('Server returned success: false', response.data);
        alert('Failed to mark donation as completed. Please try again.');
      }
    } catch (error: any) {
      console.error('Error marking donation as completed:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error marking donation as completed: ${error.response?.data?.message || error.message}`);
    } finally {
      setMarkingDonation(null);
    }
  };

  // Check if a donor has already donated for ANY request
  const isDonationCompleted = (donor: DonorResponse) => {
    return completedDonations.has(donor.donorId);
  };

  // Fetch existing completed donations (all donors who have ever donated)
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
        setCompletedDonations(new Set(uniqueDonorIds));
      }
    } catch (error) {
      console.error('Error fetching completed donations:', error);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Blood group compatibility function - FIXED LOGIC
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
    
    console.log(`Blood compatibility for ${requestedBloodGroup}:`, compatibility[requestedBloodGroup] || []);
    return compatibility[requestedBloodGroup] || [];
  };

  // Fetch blood requests from hospital
  const fetchBloodRequests = async () => {
    try {
      console.log('=== FETCHING BLOOD REQUESTS ===');
      const response = await axios.get('http://localhost:5000/blood-requests/hospital', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Blood requests response:', response.data);
      
      if (response.data.success) {
        // Add "All User Locations" as first option
        const allLocationsOption: BloodRequest = {
          _id: 'all-locations',
          bloodGroup: 'All Users',
          quantity: 0,
          urgency: 'info',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        
        const updatedRequests = [allLocationsOption, ...response.data.bloodRequests];
        setBloodRequests(updatedRequests);
        setDebugInfo(prev => prev + `\n✓ Fetched ${response.data.bloodRequests.length} blood requests`);
      }
    } catch (error: any) {
      console.error('Error fetching blood requests:', error);
      setDebugInfo(prev => prev + `\n✗ Error fetching blood requests: ${error.message}`);
      
      // Fallback to mock data for development
      const mockRequests: BloodRequest[] = [
        {
          _id: 'all-locations',
          bloodGroup: 'All Users',
          quantity: 0,
          urgency: 'info',
          status: 'active',
          createdAt: new Date().toISOString()
        }
      ];
      setBloodRequests(mockRequests);
      setDebugInfo(prev => prev + `\n⚠ Using mock blood requests data`);
    }
  };

  // Fetch all user locations with enhanced debugging
  const fetchUserLocations = async () => {
    try {
      setRefreshing(true);
      console.log('=== FRONTEND: Fetching all user locations ===');
      setDebugInfo(prev => prev + `\n🔄 Fetching user locations...`);
      
      const response = await axios.get('http://localhost:5000/donor-response/locations');
      console.log('Full API Response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      
      if (response.data && response.data.success) {
        console.log('API Success - Setting locations:', response.data.responses);
        console.log('Number of responses:', response.data.responses?.length || 0);
        setDonorResponses(response.data.responses || []);
        setDebugInfo(prev => prev + `\n✓ Loaded ${response.data.responses?.length || 0} user locations`);
      } else {
        console.log('API returned success: false');
        console.log('API message:', response.data?.message || 'No message');
        setDebugInfo(prev => prev + `\n✗ API returned success: false - ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('=== ERROR fetching user locations ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response);
      setDebugInfo(prev => prev + `\n✗ Error: ${error.message || 'Network error'}`);
      
      // Try to show some mock data for testing
      const mockData: DonorResponse[] = [
        {
          _id: 'test-1',
          name: 'Test User 1',
          phone: '1234567890',
          donorId: 'TEST001',
          location: { lat: 22.6013, lng: 72.8327 }, // Updated to correct Charusat coordinates
          status: 'responded',
          responseTime: new Date().toISOString(),
          address: 'Test Address 1'
        },
        {
          _id: 'test-2',
          name: 'Test User 2',
          phone: '0987654321',
          donorId: 'TEST002',
          location: { lat: 22.6023, lng: 72.8337 }, // Updated to correct Charusat coordinates
          status: 'responded',
          responseTime: new Date().toISOString(),
          address: 'Test Address 2'
        }
      ];
      console.log('Setting mock data for testing:', mockData);
      setDonorResponses(mockData);
      setDebugInfo(prev => prev + `\n⚠ Using mock data (${mockData.length} users)`);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch donor responses for selected request (or all locations)
  const fetchDonorResponses = async () => {
    if (!selectedRequest) {
      setDebugInfo(prev => prev + `\n⚠ No request selected`);
      return;
    }
    
    console.log('=== FETCHING DONOR RESPONSES ===');
    setDebugInfo(prev => prev + `\n🔄 Fetching responses for: ${selectedRequest}`);
    
    if (selectedRequest === 'all-locations') {
      console.log('Selected "All Locations" - fetching user locations');
      await fetchUserLocations();
      return;
    }
    
    try {
      setRefreshing(true);
      console.log('Fetching responses for request:', selectedRequest);
      
      const response = await axios.get(`http://localhost:5000/donor-response/responses/${selectedRequest}`);
      console.log('API Response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('Setting donor responses:', response.data.responses);
        setDonorResponses(response.data.responses || []);
        setDebugInfo(prev => prev + `\n✓ Loaded ${response.data.responses?.length || 0} responses`);
      } else {
        setDebugInfo(prev => prev + `\n✗ API returned success: false`);
      }
    } catch (error: any) {
      console.error('Error fetching donor responses:', error);
      setDebugInfo(prev => prev + `\n✗ Error fetching responses: ${error.message || 'Network error'}`);
    } finally {
      setRefreshing(false);
    }
  };

  // Test specific API endpoint function
  const testSpecificRequest = async () => {
    try {
      console.log('=== TESTING SPECIFIC REQUEST API ===');
      const requestId = '68a47ea630f9050be02bc4b5'; // The ID from your SMS
      setDebugInfo(prev => prev + `\n🧪 Testing API for request: ${requestId}`);
      
      const response = await axios.get(`http://localhost:5000/donor-response/responses/${requestId}`);
      console.log('Direct API Response:', response);
      console.log('Response Data:', response.data);
      
      if (response.data && response.data.success) {
        const responses = response.data.responses || [];
        console.log('Parsed responses:', responses);
        setDebugInfo(prev => prev + `\n✅ Direct API test successful: ${responses.length} responses`);
        
        // Log each response details
        responses.forEach((resp: any, index: number) => {
          console.log(`Response ${index + 1}:`, {
            name: resp.name,
            bloodGroup: resp.bloodGroup,
            location: resp.location,
            phone: resp.phone,
            status: resp.status
          });
          setDebugInfo(prev => prev + `\n  • ${resp.name} (${resp.bloodGroup}) at [${resp.location?.lat}, ${resp.location?.lng}]`);
        });
        
        // Manually set the responses to see if it displays
        setDonorResponses(responses);
        setSelectedRequest(requestId);
      } else {
        setDebugInfo(prev => prev + `\n❌ API test failed: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Direct API test error:', error);
      setDebugInfo(prev => prev + `\n❌ API test error: ${error.message}`);
    }
  };

  // Test API endpoint
  const testApiConnection = async () => {
    try {
      console.log('=== TESTING API CONNECTION ===');
      setDebugInfo(prev => prev + `\n🔧 Testing API connection...`);
      
      const response = await axios.get('http://localhost:5000/donor-response/test');
      console.log('Test response:', response.data);
      setDebugInfo(prev => prev + `\n✓ API connection successful`);
    } catch (error: any) {
      console.error('API test failed:', error);
      setDebugInfo(prev => prev + `\n✗ API connection failed: ${error.message || 'Network error'}`);
    }
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get distance category for display
  const getDistanceCategory = (distance: number): { label: string; color: string } => {
    if (distance <= 5) return { label: 'Near', color: 'text-green-600' };
    return { label: 'Far', color: 'text-red-600' };
  };

  // NEW: Debug coordinates function
  const debugCoordinates = () => {
    console.log('=== COORDINATE DEBUGGING ===');
    console.log('Hospital Location (Charusat):', hospitalLocation);
    console.log('Expected Charusat coordinates: lat: 22.6013, lng: 72.8327');
    
    donorResponses.forEach((donor, index) => {
      console.log(`\n--- Donor ${index + 1}: ${donor.name} ---`);
      console.log('Stored coordinates:', donor.location);
      console.log('Latitude:', donor.location?.lat);
      console.log('Longitude:', donor.location?.lng);
      
      if (donor.location) {
        const distance = calculateDistance(
          hospitalLocation.lat, hospitalLocation.lng,
          donor.location.lat, donor.location.lng
        );
        console.log('Calculated distance:', distance.toFixed(2), 'km');
        
        // Check if coordinates might be swapped
        const swappedDistance = calculateDistance(
          hospitalLocation.lat, hospitalLocation.lng,
          donor.location.lng, donor.location.lat // Swapped lat/lng
        );
        console.log('Distance if lat/lng swapped:', swappedDistance.toFixed(2), 'km');
        
        // Check coordinate ranges
        console.log('Lat in valid range (20-25)?', donor.location.lat >= 20 && donor.location.lat <= 25);
        console.log('Lng in valid range (70-75)?', donor.location.lng >= 70 && donor.location.lng <= 75);
      }
    });
    
    setDebugInfo(prev => prev + `\n🔍 Coordinate debug completed - check console`);
  };

  // NEW: Set nearby test users with correct Charusat coordinates
  const setNearbyTestUsers = () => {
    const nearbyUsers: DonorResponse[] = [
      {
        _id: 'nearby-1',
        name: 'Nearby User 1',
        phone: '9999999991',
        donorId: 'NEAR001',
        location: { lat: 22.6020, lng: 72.8330 }, // ~100m from Charusat
        status: 'responded',
        responseTime: new Date().toISOString(),
        address: 'Very close to Charusat'
      },
      {
        _id: 'nearby-2', 
        name: 'Nearby User 2',
        phone: '9999999992',
        donorId: 'NEAR002',
        location: { lat: 22.6050, lng: 72.8350 }, // ~500m from Charusat
        status: 'responded',
        responseTime: new Date().toISOString(),
        address: 'Close to Charusat'
      },
      {
        _id: 'nearby-3',
        name: 'Nearby User 3', 
        phone: '9999999993',
        donorId: 'NEAR003',
        location: { lat: 22.6100, lng: 72.8400 }, // ~1km from Charusat
        status: 'responded',
        responseTime: new Date().toISOString(),
        address: '1km from Charusat'
      }
    ];
    
    console.log('Setting nearby test users:', nearbyUsers);
    setDonorResponses(nearbyUsers);
    setDebugInfo(prev => prev + `\n🎯 Set ${nearbyUsers.length} nearby test users`);
  };

  // Add this debug function
  const debugData = () => {
    console.log('=== COMPLETE DEBUG INFO ===');
    console.log('Raw donor responses:', donorResponses);
    console.log('Donors with distance:', donorsWithDistance);
    console.log('Filtered donors:', filteredDonors);
    console.log('Hospital location:', hospitalLocation);
    console.log('Current filters:', { radiusFilter, selectedStatus, selectedRequest });
    
    // Test with a specific location
    if (donorResponses.length > 0) {
      const firstDonor = donorResponses[0];
      console.log('Testing first donor:', firstDonor);
      if (firstDonor.location) {
        const testDistance = calculateDistance(
          hospitalLocation.lat, hospitalLocation.lng,
          firstDonor.location.lat, firstDonor.location.lng
        );
        console.log('Test distance calculation:', testDistance);
        console.log('Distance under radius?', testDistance <= radiusFilter);
      }
    }
    
    // Debug the actual blood request
    const selectedBloodRequest = bloodRequests.find(req => req._id === selectedRequest);
    console.log('Selected blood request:', selectedBloodRequest);
    
    // Debug compatibility for each donor
    donorResponses.forEach((donor, index) => {
      console.log(`--- Donor ${index + 1}: ${donor.name} ---`);
      console.log('Donor blood group:', donor.bloodGroup);
      console.log('Request blood group:', selectedBloodRequest?.bloodGroup);
      if (selectedBloodRequest && selectedRequest !== 'all-locations') {
        const compatibleGroups = getCompatibleBloodGroups(selectedBloodRequest.bloodGroup);
        const isCompatible = compatibleGroups.includes(donor.bloodGroup || 'Unknown');
        console.log('Compatible groups:', compatibleGroups);
        console.log('Is compatible?', isCompatible);
      }
    });
  };

  // Force test users function - UPDATED COORDINATES
  const forceShowTestUsers = () => {
    const testUsers: DonorResponse[] = [
      {
        _id: 'force-test-1',
        name: 'Force Test User 1',
        phone: '1111111111',
        donorId: 'FORCE001',
        location: { lat: 22.6013, lng: 72.8327 }, // Exact Charusat location
        status: 'responded',
        responseTime: new Date().toISOString(),
        address: 'At Charusat Location'
      },
      {
        _id: 'force-test-2',
        name: 'Force Test User 2',
        phone: '2222222222',
        donorId: 'FORCE002',
        location: { lat: 22.6023, lng: 72.8337 }, // Very close to Charusat
        status: 'responded',
        responseTime: new Date().toISOString(),
        address: 'Near Charusat'
      }
    ];
    
    console.log('Force setting test users:', testUsers);
    setDonorResponses(testUsers);
    setDebugInfo(prev => prev + `\n🔧 Force loaded ${testUsers.length} test users`);
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setDebugInfo('=== INITIALIZING LIVE MAP ===');
      
      try {
        // Test API connection first
        await testApiConnection();
        
        // Then fetch blood requests
        await fetchBloodRequests();
        
        // Then immediately fetch user locations since default is "all-locations"
        await fetchUserLocations();
        
      } catch (error: any) {
        console.error('Initialization error:', error);
        setDebugInfo(prev => prev + `\n✗ Initialization error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      fetchDonorResponses();
      // Fetch completed donations for all donors
      fetchCompletedDonations();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDonorResponses();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      // Still fetch completed donations even for "all-locations"
      fetchCompletedDonations();
    }
  }, [selectedRequest]);

  // Add distance and blood group compatibility filtering to donor responses
  const donorsWithDistance = donorResponses.map((donor) => {
    const selectedBloodRequest = bloodRequests.find(req => req._id === selectedRequest);
    const bloodGroup = selectedBloodRequest ? selectedBloodRequest.bloodGroup : 'Unknown';
    
    const distance = donor.location ? calculateDistance(
      hospitalLocation.lat, hospitalLocation.lng,
      donor.location.lat,
      donor.location.lng
    ) : 0;
    
    // Add debug logging for each donor
    console.log('=== DONOR PROCESSING DEBUG ===');
    console.log('Donor:', donor.name);
    console.log('Donor blood group:', donor.bloodGroup || 'Unknown');
    console.log('Requested blood group:', bloodGroup);
    console.log('Donor location:', donor.location);
    console.log('Hospital location:', hospitalLocation);
    console.log('Calculated distance:', distance);
    console.log('Current radius filter:', radiusFilter);
    console.log('Distance filter passed?', distance <= radiusFilter);
    
    // Check blood group compatibility if a specific request is selected
    let isCompatible = true;
    if (selectedRequest && selectedRequest !== 'all-locations' && selectedBloodRequest) {
      const compatibleGroups = getCompatibleBloodGroups(selectedBloodRequest.bloodGroup);
      const donorBloodGroup = donor.bloodGroup || 'Unknown';
      isCompatible = compatibleGroups.includes(donorBloodGroup);
      console.log('Compatible blood groups for', selectedBloodRequest.bloodGroup, ':', compatibleGroups);
      console.log('Donor blood group:', donorBloodGroup);
      console.log('Is compatible?', isCompatible);
    }
    
    return {
      ...donor,
      id: donor._id,
      lat: donor.location?.lat || 0,
      lng: donor.location?.lng || 0,
      bloodGroup: donor.bloodGroup || 'Unknown',
      requestedBloodGroup: bloodGroup === 'All Users' ? 'Unknown' : bloodGroup,
      distance: distance,
      isCompatible: isCompatible
    };
  });

  // Also add debug logging for the filtered results
  console.log('=== FILTERING RESULTS ===');
  console.log('Total donors with distance:', donorsWithDistance.length);
  console.log('Donors data:', donorsWithDistance);
  console.log('Radius filter:', radiusFilter);
  console.log('Status filter:', selectedStatus);

  const filteredDonors = donorsWithDistance.filter(donor => {
    // Filter out donors who have already donated
    if (isDonationCompleted(donor)) {
      return false;
    }
    
    const withinRadius = donor.distance <= radiusFilter;
    const matchesStatus = selectedStatus === 'all' || donor.status === selectedStatus;
    let isBloodGroupCompatible = true;
    if (selectedRequest && selectedRequest !== 'all-locations') {
      isBloodGroupCompatible = donor.isCompatible;
    }
    // If 'All Donors' or 'All User Locations' is selected, only show donors who have shared location
    if (selectedRequest === 'all-locations' || selectedRequest === 'all-donors') {
      const hasLocation = donor.lat !== 0 && donor.lng !== 0;
      return withinRadius && matchesStatus && hasLocation;
    }
    return withinRadius && matchesStatus && isBloodGroupCompatible;
  });

  console.log('Filtered donors:', filteredDonors.length);
  console.log('Filtered donors data:', filteredDonors);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live User Map</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2">Loading user locations...</span>
        </div>
        {/* Debug info during loading */}
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded">
          <strong>Debug Log:</strong>
          <pre className="text-xs mt-2 whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Blood Request Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Live User Map</h2>
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Blood Request Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
            <select
              value={selectedRequest}
              onChange={(e) => setSelectedRequest(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {bloodRequests.map((request) => (
                <option key={request._id} value={request._id}>
                  {request._id === 'all-locations' ? 'All User Locations' : `${request.bloodGroup} - ${new Date(request.createdAt).toLocaleDateString()}`}
                </option>
              ))}
            </select>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={fetchDonorResponses}
            disabled={refreshing}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          {/* Test API Button */}
          <button
            onClick={testApiConnection}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            <span>Test API</span>
          </button>

          {/* Test Specific Request Button */}
          <button
            onClick={testSpecificRequest}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            <span>Test SMS Request</span>
          </button>
          
          {/* Debug Coordinates Button - NEW */}
          <button
            onClick={debugCoordinates}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            <span>Debug Coords</span>
          </button>

          {/* Nearby Test Users Button - NEW */}
          <button
            onClick={setNearbyTestUsers}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            <span>Nearby Test</span>
          </button>

          {/* Debug Data Button */}
          <button
            onClick={debugData}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            <span>Debug Data</span>
          </button>

          {/* Force Test Users Button */}
          <button
            onClick={forceShowTestUsers}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            <span>Force Test</span>
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            <span>{filteredDonors.length} users found</span>
          </div>
        </div>
      </div>

      {/* Enhanced Debug Info */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
        <strong>Map Status:</strong>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
          <div>Selected View: <span className="font-semibold">{selectedRequest === 'all-locations' ? 'All Locations' : 'Specific Request'}</span></div>
          <div>Total Users: <span className="font-semibold">{donorResponses.length}</span></div>
          <div>In Range: <span className="font-semibold">{filteredDonors.length}</span></div>
          <div>Radius: <span className="font-semibold">{radiusFilter}km</span></div>
        </div>
      </div>

      {/* Debug Log */}
      <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded">
        <div className="flex justify-between items-center">
          <strong>Debug Log:</strong>
          <button 
            onClick={() => setDebugInfo('')}
            className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            Clear Log
          </button>
        </div>
        <pre className="text-xs mt-2 whitespace-pre-wrap max-h-32 overflow-y-auto">{debugInfo}</pre>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Map Controls */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Radius:</span>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={radiusFilter}
                      onChange={(e) => setRadiusFilter(parseInt(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{radiusFilter}km</span>
                  </div>

                  {/* Blood Group Compatibility Indicator */}
                  {selectedRequest && selectedRequest !== 'all-locations' && (
                    <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg border border-red-200 dark:border-red-800">
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Filtering for: {bloodRequests.find(req => req._id === selectedRequest)?.bloodGroup || 'Unknown'} compatible donors
                      </span>
                    </div>
                  )}
                  
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="responded">Located</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                {/* Distance Legend and Fullscreen Button */}
                <div className="flex items-center space-x-4">
                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    title="Open Fullscreen Map"
                  >
                    <Maximize className="h-4 w-4" />
                    <span>Fullscreen</span>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Near (≤5km)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Far (&gt;5km)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-600 rounded border-2 border-white shadow-sm flex items-center justify-center text-xs">🏥</div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Hospital</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Map Integration */}
            <div className="h-96">
              {(() => {
                console.log('=== MAP RENDERING DEBUG ===');
                console.log('filteredDonors length:', filteredDonors.length);
                console.log('filteredDonors data:', filteredDonors);
                
                const mapDonors = filteredDonors.map(d => ({
                  id: parseInt(d._id.slice(-6), 16) || Math.random() * 1000000,
                  name: d.name || 'Unknown',
                  lat: d.lat || 0,
                  lng: d.lng || 0,
                  bloodGroup: d.bloodGroup || 'Unknown',
                  seen: true,
                  distance: d.distance // Add distance to map donors
                }));
                
                console.log('Map donors being passed to CharusatMap:', mapDonors);
                
                return filteredDonors.length > 0 ? (
                  <CharusatMap donors={mapDonors} />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No users found</p>
                      <p className="text-sm">Total loaded: {donorResponses.length}, Radius: {radiusFilter}km</p>
                      <button 
                        onClick={() => setRadiusFilter(100)}
                        className="mt-2 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        Increase Radius to 100km
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* User List Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">User Locations</h3>
                </div>
                {refreshing && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                )}
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {filteredDonors.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No users found in this area</p>
                  <p className="text-xs mt-1">Total locations loaded: {donorResponses.length}</p>
                  <p className="text-xs">Try increasing the radius filter</p>
                  <button 
                    onClick={fetchUserLocations}
                    className="mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    Reload Locations
                  </button>
                </div>
              ) : (
                filteredDonors.map((donor) => {
                  const distanceInfo = getDistanceCategory(donor.distance);
                  
                  return (
                    <div key={donor._id} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{donor.name}</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Navigation className="h-3 w-3 text-gray-400" />
                            <span className={`text-sm font-medium ${distanceInfo.color}`}>
                              {donor.distance.toFixed(1)}km
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="font-medium text-blue-600 dark:text-blue-400">ID: {donor.donorId}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${distanceInfo.color.includes('green') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {distanceInfo.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        📞 {donor.phone}
                      </div>
                      {donor.address && (
                        <div className="text-xs text-gray-500 truncate">
                          📍 {donor.address}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-400">
                        Last seen: {new Date(donor.responseTime).toLocaleString()}
                      </div>
                      
                      {/* Show "Mark as Donated" button only when filtering by a specific request */}
                      {selectedRequest && selectedRequest !== 'all-locations' && (
                        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-600">
                          <button
                            onClick={() => markDonationCompleted(donor)}
                            disabled={markingDonation === donor._id}
                            className={`w-full text-xs px-3 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1 ${
                              markingDonation === donor._id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>
                              {markingDonation === donor._id ? 'Marking...' : 'Mark as Donated'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredDonors.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Very Close (&lt;2km)</p>
              <p className="text-2xl font-bold text-green-600">{filteredDonors.filter(d => d.distance < 2).length}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Near (≤5km)</p>
              <p className="text-2xl font-bold text-green-600">{filteredDonors.filter(d => d.distance <= 5).length}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Far (&gt;5km)</p>
              <p className="text-2xl font-bold text-red-600">{filteredDonors.filter(d => d.distance > 5).length}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-500"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Distance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredDonors.length > 0 ? (filteredDonors.reduce((sum, d) => sum + d.distance, 0) / filteredDonors.length).toFixed(1) : 0}km
              </p>
            </div>
            <MapPin className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Fullscreen Map Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-75 flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-gray-800 relative overflow-hidden">
            {/* Fullscreen Map Header */}
            <div className="absolute top-0 left-0 right-0 z-[10000] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Live User Map - Fullscreen</h2>
                  
                  {/* Quick controls in fullscreen */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Radius:</span>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={radiusFilter}
                      onChange={(e) => setRadiusFilter(parseInt(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{radiusFilter}km</span>
                  </div>
                  
                  <select
                    value={selectedRequest}
                    onChange={(e) => setSelectedRequest(e.target.value)}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {bloodRequests.map((request) => (
                      <option key={request._id} value={request._id}>
                        {request._id === 'all-locations' ? 'All User Locations' : `${request.bloodGroup} - ${new Date(request.createdAt).toLocaleDateString()}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Close button */}
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors z-[10001]"
                  title="Close Fullscreen"
                >
                  <X className="h-4 w-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
            
            {/* Fullscreen Map Content */}
            <div className="absolute inset-0 pt-20 pb-20 z-[9998]">
              {(() => {
                const mapDonors = filteredDonors.map(d => ({
                  id: parseInt(d._id.slice(-6), 16) || Math.random() * 1000000,
                  name: d.name || 'Unknown',
                  lat: d.lat || 0,
                  lng: d.lng || 0,
                  bloodGroup: d.bloodGroup || 'Unknown',
                  seen: true,
                  distance: d.distance
                }));
                
                return filteredDonors.length > 0 ? (
                  <div className="w-full h-full">
                    <CharusatMap donors={mapDonors} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900 text-gray-500">
                    <div className="text-center">
                      <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-xl">No users found</p>
                      <p className="text-sm">Total loaded: {donorResponses.length}, Radius: {radiusFilter}km</p>
                      <button 
                        onClick={() => setRadiusFilter(100)}
                        className="mt-4 text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200"
                      >
                        Increase Radius to 100km
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Stats overlay in fullscreen */}
            <div className="absolute bottom-0 left-0 right-0 z-[10000] p-4 bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Users</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredDonors.length}</p>
                    </div>
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Very Close (&lt;2km)</p>
                      <p className="text-xl font-bold text-green-600">{filteredDonors.filter(d => d.distance < 2).length}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Near (≤5km)</p>
                      <p className="text-xl font-bold text-green-600">{filteredDonors.filter(d => d.distance <= 5).length}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Far (&gt;5km)</p>
                      <p className="text-xl font-bold text-red-600">{filteredDonors.filter(d => d.distance > 5).length}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-red-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}