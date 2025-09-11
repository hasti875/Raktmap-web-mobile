
import React, { useState, useEffect } from 'react';
import { Map, MapPin, Users, RefreshCw, Filter, Maximize, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from '../../utils/axios';

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

interface Donor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: string;
  status: 'available' | 'responded' | 'unavailable';
  address?: string;
  createdAt: string;
}

// Create custom marker icons for different response statuses
const createStatusIcon = (status: string) => {
  const colors = {
    'responded': '#10B981', // Green
    'clicked': '#F59E0B',   // Yellow
    'shared': '#3B82F6',    // Blue
    'no-response': '#EF4444', // Red
    'available': '#10B981',  // Green
    'unavailable': '#6B7280' // Gray
  };
  
  const color = colors[status as keyof typeof colors] || '#6B7280';
  
  return L.divIcon({
    className: 'custom-donor-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 6px;
          height: 6px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

// Hospital marker icon
const hospitalIcon = L.divIcon({
  className: 'hospital-marker',
  html: `
    <div style="
      background-color: #DC2626;
      width: 25px;
      height: 25px;
      border-radius: 6px;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">
      🏥
    </div>
  `,
  iconSize: [25, 25],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const LiveDonorMap = () => {
  const [donorResponses, setDonorResponses] = useState<DonorResponse[]>([]);
  const [allDonors, setAllDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState({
    responded: 0,
    clicked: 0,
    shared: 0,
    noResponse: 0
  });

  // Charusat University coordinates (admin view center)
  const centerLocation: [number, number] = [22.6001, 72.8205];

  // Fetch donor responses with locations
  const fetchDonorResponses = async () => {
    try {
      setRefreshing(true);
      console.log('Fetching donor responses for admin map...');
      
      const response = await axios.get('/donor-response/locations');
      if (response.data.success) {
        setDonorResponses(response.data.responses || []);
        console.log('Fetched donor responses:', response.data.responses?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching donor responses:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch all donors
  const fetchAllDonors = async () => {
    try {
      const response = await axios.get('/admin/donors');
      if (response.data.success) {
        setAllDonors(response.data.donors || []);
        console.log('Fetched all donors:', response.data.donors?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const responded = donorResponses.filter(d => d.status === 'responded').length;
    const clicked = donorResponses.filter(d => d.status === 'clicked').length;
    const shared = donorResponses.filter(d => d.status === 'shared').length;
    const total = allDonors.length;
    const noResponse = total - responded - clicked - shared;

    setStats({
      responded,
      clicked,
      shared,
      noResponse: Math.max(0, noResponse)
    });
  };

  // Filter donors based on selected status
  const getFilteredDonors = () => {
    if (selectedStatus === 'all') {
      return donorResponses;
    }
    return donorResponses.filter(donor => donor.status === selectedStatus);
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDonorResponses(), fetchAllDonors()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Recalculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [donorResponses, allDonors]);

  // Refresh data
  const handleRefresh = () => {
    fetchDonorResponses();
    fetchAllDonors();
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Live Donor Response Map</h2>
          <p className="text-gray-600">Loading donor locations and response data...</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const MapComponent = () => (
    <div className="relative">
      <MapContainer 
        center={centerLocation} 
        zoom={13} 
        style={{ height: isFullscreen ? '90vh' : '500px', width: '100%' }}
        className="rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Hospital/Admin Center Marker */}
        <Marker position={centerLocation} icon={hospitalIcon}>
          <Popup>
            <div className="text-center">
              <strong>Charusat University</strong><br />
              <span className="text-sm text-gray-600">Admin Center</span>
            </div>
          </Popup>
        </Marker>
        
        {/* Donor Response Markers */}
        {getFilteredDonors().map(donor => {
          if (!donor.location || !donor.location.lat || !donor.location.lng) return null;
          
          return (
            <Marker 
              key={donor._id} 
              position={[donor.location.lat, donor.location.lng]}
              icon={createStatusIcon(donor.status)}
            >
              <Popup>
                <div className="text-center min-w-48">
                  <strong className="text-lg">{donor.name}</strong><br />
                  <span className="text-sm">Blood Group: <strong>{donor.bloodGroup || 'Unknown'}</strong></span><br />
                  <span className="text-sm">Phone: {donor.phone}</span><br />
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                    donor.status === 'responded' ? 'bg-green-100 text-green-800' :
                    donor.status === 'clicked' ? 'bg-yellow-100 text-yellow-800' :
                    donor.status === 'shared' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Status: {donor.status}
                  </span><br />
                  {donor.address && (
                    <span className="text-xs text-gray-600 mt-1 block">
                      {donor.address}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 block mt-1">
                    Response: {new Date(donor.responseTime).toLocaleString()}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
          title="Refresh Data"
        >
          <RefreshCw className={`h-4 w-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <X className="h-4 w-4 text-gray-600" /> : <Maximize className="h-4 w-4 text-gray-600" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : 'space-y-8'}`}>
      {!isFullscreen && (
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Live Donor Response Map</h2>
          <p className="text-gray-600">Real-time visualization of donor responses with location data</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-green-800">Responded</p>
              <p className="text-green-600 text-xl font-bold">{stats.responded}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-yellow-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-yellow-800">SMS Clicked</p>
              <p className="text-yellow-600 text-xl font-bold">{stats.clicked}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-blue-800">Location Shared</p>
              <p className="text-blue-600 text-xl font-bold">{stats.shared}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-red-800">No Response</p>
              <p className="text-red-600 text-xl font-bold">{stats.noResponse}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-700">Filter by status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Statuses</option>
            <option value="responded">Responded</option>
            <option value="clicked">SMS Clicked</option>
            <option value="shared">Location Shared</option>
            <option value="no-response">No Response</option>
          </select>
          <span className="text-sm text-gray-600 ml-4">
            Showing {getFilteredDonors().length} of {donorResponses.length} donors with location data
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-white rounded-2xl shadow-lg border border-red-100 overflow-hidden">
        <MapComponent />
      </div>
    </div>
  );
};

export { LiveDonorMap };