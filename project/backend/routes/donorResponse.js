const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import Donor model
const Donor = require('../models/Donor');
const DonorLocationResponse = require('../models/DonorLocationResponse');

// ADD THIS TEST ENDPOINT AT THE TOP
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Donor response API is working!',
    timestamp: new Date()
  });
});

// Get all available donors with their information
router.get('/available-donors', async (req, res) => {
  try {
    console.log('=== FETCHING AVAILABLE DONORS ===');
    
    // Get all donors from the donors collection
    const donors = await Donor.find({}).sort({ createdAt: -1 });
    console.log('Donors found:', donors.length);
    
    // Get recent location data to match with donors
    const locations = await mongoose.connection.db.collection('locations').find({}).toArray();
    console.log('Locations found:', locations.length);
    
    // Combine donor data with location data
    const availableDonors = donors.map(donor => {
      // Try to find matching location by multiple criteria for better matching
      const location = locations.find(loc => {
        // Match by phone number (most reliable)
        const phoneMatch = loc.mobileNumber === donor.phone || 
                          loc.mobileNumber === donor.phone.replace(/\s+/g, '') ||
                          loc.mobileNumber?.replace(/\s+/g, '') === donor.phone.replace(/\s+/g, '');
        
        // Match by name (case insensitive, flexible matching)
        const nameMatch = loc.userName && donor.name && 
                         loc.userName.toLowerCase().trim() === donor.name.toLowerCase().trim();
        
        return phoneMatch || nameMatch;
      });
      
      // Calculate distance if location is available
      let distance = null;
      let detailedStatus = 'not_contacted'; // Default status
      
      if (location && location.latitude && location.longitude) {
        const hospitalLat = 22.6013;
        const hospitalLng = 72.8327;
        distance = calculateDistance(hospitalLat, hospitalLng, location.latitude, location.longitude);
        detailedStatus = 'location_shared';
      }
      
      // Determine status based on location sharing
      let status = 'available';
      if (location) {
        status = 'responded'; // Has shared location via SMS link
      }
      
      return {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        bloodGroup: donor.bloodGroup,
        rollNo: donor.rollNo,
        status: status,
        detailedStatus: detailedStatus, // More specific status
        distance: distance,
        lastDonation: null, // This would need to be tracked separately
        address: location ? location.address : null,
        location: location ? {
          lat: location.latitude,
          lng: location.longitude
        } : null,
        responseTime: location ? location.timestamp : null,
        hasLocationData: !!location, // Boolean flag for easier filtering
        matchedBy: location ? (locations.find(l => l.mobileNumber === donor.phone) ? 'phone' : 'name') : null
      };
    });
    
    // Sort donors: those with location data first, then by distance, then by name
    availableDonors.sort((a, b) => {
      if (a.hasLocationData && !b.hasLocationData) return -1;
      if (!a.hasLocationData && b.hasLocationData) return 1;
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      return a.name.localeCompare(b.name);
    });
    
    console.log('Available donors processed:', availableDonors.length);
    console.log('Donors with location:', availableDonors.filter(d => d.hasLocationData).length);
    
    res.json({
      success: true,
      donors: availableDonors,
      total: availableDonors.length,
      withLocation: availableDonors.filter(d => d.hasLocationData).length,
      withoutLocation: availableDonors.filter(d => !d.hasLocationData).length
    });
    
  } catch (error) {
    console.error('Error fetching available donors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available donors',
      error: error.message
    });
  }
});

// Helper function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Create a model for the locations collection
const LocationSchema = new mongoose.Schema({
  address: String,
  latitude: Number,
  longitude: Number,
  userName: String,
  rollNumber: String,
  mobileNumber: String,
  timestamp: Date
}, { collection: 'locations' });

const Location = mongoose.model('Location', LocationSchema);

// Get all locations (user positions) for the live map
router.get('/locations', async (req, res) => {
  try {
    console.log('=== FETCHING LOCATIONS WITH BLOOD GROUP INFO ===');
    
    // Get all donors to match with location data
    const donors = await Donor.find({});
    console.log('Found donors for matching:', donors.length);
    
    // Get locations from the old locations collection
    const allDocuments = await mongoose.connection.db.collection('locations').find({}).toArray();
    console.log('Old locations found:', allDocuments.length);
    
    // Get new location responses from DonorLocationResponse model
    const newLocationResponses = await DonorLocationResponse.find({})
      .populate('donorId')
      .populate('requestId')
      .sort({ createdAt: -1 });
    console.log('New location responses found:', newLocationResponses.length);
    
    // Transform old locations
    const transformedOldLocations = allDocuments.map(location => {
      console.log('Processing old location for:', location.userName);
      
      // Try to match with donor data to get blood group
      const matchingDonor = donors.find(donor => {
        const phoneMatch = donor.phone === location.mobileNumber || 
                          donor.phone?.replace(/\s+/g, '') === location.mobileNumber?.replace(/\s+/g, '');
        const nameMatch = donor.name && location.userName && 
                         donor.name.toLowerCase().trim() === location.userName.toLowerCase().trim();
        return phoneMatch || nameMatch;
      });
      
      if (matchingDonor) {
        console.log(`Matched ${location.userName} with donor ${matchingDonor.name}, blood group: ${matchingDonor.bloodGroup}`);
      }
      
      return {
        _id: location._id.toString(),
        name: location.userName || 'Unknown User',
        phone: location.mobileNumber || 'No phone',
        donorId: location.rollNumber || 'No ID',
        bloodGroup: matchingDonor ? matchingDonor.bloodGroup : 'Unknown',
        location: {
          lat: location.latitude,
          lng: location.longitude
        },
        status: 'responded',
        responseTime: location.timestamp || new Date(),
        address: location.address,
        source: 'old_collection'
      };
    });
    
    // Transform new location responses
    const transformedNewLocations = newLocationResponses.map(response => {
      console.log('Processing new location response for:', response.donorId?.name);
      
      return {
        _id: response._id.toString(),
        name: response.donorId?.name || 'Unknown User',
        phone: response.donorId?.phone || 'No phone',
        donorId: response.donorId?._id.toString() || 'No ID',
        bloodGroup: response.donorId?.bloodGroup || 'Unknown',
        location: {
          lat: response.latitude,
          lng: response.longitude
        },
        status: response.isAvailable ? 'responded' : 'unavailable',
        responseTime: response.responseTime || response.createdAt,
        address: response.address,
        requestId: response.requestId?._id.toString(),
        source: 'new_model'
      };
    });
    
    // Combine both sources, prioritizing new responses
    const allLocations = [...transformedNewLocations, ...transformedOldLocations];
    
    console.log('Total combined locations:', allLocations.length);
    console.log('New model locations:', transformedNewLocations.length);
    console.log('Old collection locations:', transformedOldLocations.length);
    
    res.json({
      success: true,
      responses: allLocations,
      summary: {
        total: allLocations.length,
        newModel: transformedNewLocations.length,
        oldCollection: transformedOldLocations.length
      }
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message
    });
  }
});

// Get donor responses for a specific blood request
router.get('/responses/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { timeFilter = 'all', maxAgeHours } = req.query; // New filtering parameters
    
    console.log('Fetching responses for requestId:', requestId);
    console.log('Time filter:', timeFilter, 'Max age hours:', maxAgeHours);
    
    // Helper function to normalize blood group strings
    const normalizeBloodGroup = (bloodGroup) => {
      if (!bloodGroup || bloodGroup === 'Unknown') return 'Unknown';
      // Remove spaces and standardize format
      return bloodGroup.replace(/\s+/g, '').toUpperCase();
    };
    
    // Get the blood request to know when it was created
    const BloodRequest = require('../models/BloodRequest');
    const bloodRequest = await BloodRequest.findById(requestId);
    
    if (!bloodRequest) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found'
      });
    }
    
    console.log('Blood request created at:', bloodRequest.createdAt);
    
    // Calculate time filter boundaries
    let responseTimeFilter = {};
    const requestCreatedAt = bloodRequest.createdAt;
    
    if (timeFilter === 'after-request') {
      // Only responses AFTER the blood request was created
      responseTimeFilter = { $gte: requestCreatedAt };
    } else if (timeFilter === 'recent' || maxAgeHours) {
      // Only responses within specified hours (default 24 hours)
      const hoursLimit = parseInt(maxAgeHours) || 24;
      const cutoffTime = new Date(Date.now() - (hoursLimit * 60 * 60 * 1000));
      responseTimeFilter = { 
        $gte: new Date(Math.max(requestCreatedAt.getTime(), cutoffTime.getTime()))
      };
    }
    // 'all' filter = no time restrictions
    
    // Get all donors to match with location data
    const donors = await Donor.find({});
    console.log('Found donors:', donors.length);
    
    // Get new location responses for this specific request with time filtering
    let newResponseQuery = { requestId };
    if (Object.keys(responseTimeFilter).length > 0) {
      newResponseQuery.createdAt = responseTimeFilter;
    }
    
    const newLocationResponses = await DonorLocationResponse.find(newResponseQuery)
      .populate('donorId')
      .populate('requestId')
      .sort({ createdAt: -1 });
    console.log('New location responses found for request:', newLocationResponses.length);
    
    // Get old locations with time filtering
    let oldLocationFilter = {};
    if (Object.keys(responseTimeFilter).length > 0) {
      oldLocationFilter.timestamp = responseTimeFilter;
    }
    
    const locations = await mongoose.connection.db.collection('locations')
      .find(oldLocationFilter)
      .toArray();
    
    // Transform new location responses with enhanced time info
    const transformedNewResponses = newLocationResponses.map(response => {
      const responseTime = response.responseTime || response.createdAt;
      const timeSinceRequest = responseTime ? 
        Math.round((responseTime.getTime() - requestCreatedAt.getTime()) / (1000 * 60)) : null;
      
      return {
        _id: response._id.toString(),
        requestId: requestId,
        name: response.donorId?.name || 'Unknown User',
        phone: response.donorId?.phone || 'No phone',
        donorId: response.donorId?._id.toString() || 'No ID',
        bloodGroup: normalizeBloodGroup(response.donorId?.bloodGroup) || 'Unknown',
        location: {
          lat: response.latitude,
          lng: response.longitude
        },
        status: response.isAvailable ? 'responded' : 'unavailable',
        responseTime: responseTime,
        timeSinceRequest: timeSinceRequest, // Minutes after request was created
        address: response.address,
        source: 'token_response',
        isRecentResponse: timeSinceRequest !== null && timeSinceRequest >= 0
      };
    });
    
    // Transform old locations with enhanced time info
    const transformedOldLocations = locations.map(location => {
      // Try to match with donor data to get blood group
      const matchingDonor = donors.find(donor => {
        const phoneMatch = donor.phone === location.mobileNumber || 
                          donor.phone?.replace(/\s+/g, '') === location.mobileNumber?.replace(/\s+/g, '');
        const nameMatch = donor.name && location.userName && 
                         donor.name.toLowerCase().trim() === location.userName.toLowerCase().trim();
        return phoneMatch || nameMatch;
      });
      
      const responseTime = location.timestamp || new Date();
      const timeSinceRequest = Math.round((responseTime.getTime() - requestCreatedAt.getTime()) / (1000 * 60));
      
      return {
        _id: location._id.toString(),
        requestId: requestId,
        name: location.userName || 'Unknown User',
        phone: location.mobileNumber || 'No phone',
        donorId: location.rollNumber || 'No ID',
        bloodGroup: normalizeBloodGroup(matchingDonor ? matchingDonor.bloodGroup : 'Unknown'),
        location: {
          lat: location.latitude,
          lng: location.longitude
        },
        status: 'responded',
        responseTime: responseTime,
        timeSinceRequest: timeSinceRequest, // Minutes after request was created
        address: location.address,
        source: 'old_collection',
        isRecentResponse: timeSinceRequest >= 0
      };
    });
    
    // Combine both sources, prioritizing new responses
    let allResponses = [...transformedNewResponses, ...transformedOldLocations];
    
    // Sort by response time (most recent first)
    allResponses.sort((a, b) => {
      if (!a.responseTime) return 1;
      if (!b.responseTime) return -1;
      return new Date(b.responseTime).getTime() - new Date(a.responseTime).getTime();
    });
    
    // Filter out responses that came BEFORE the request (if any)
    const validResponses = allResponses.filter(response => response.isRecentResponse);
    const invalidResponses = allResponses.filter(response => !response.isRecentResponse);
    
    console.log(`Total responses for request ${requestId}:`, allResponses.length);
    console.log('Valid responses (after request):', validResponses.length);
    console.log('Invalid responses (before request):', invalidResponses.length);
    console.log('New token responses:', transformedNewResponses.length);
    console.log('Old collection responses:', transformedOldLocations.length);
    
    res.json({
      success: true,
      responses: validResponses, // Only return valid responses
      requestInfo: {
        requestId: requestId,
        createdAt: bloodRequest.createdAt,
        bloodGroup: bloodRequest.bloodGroup,
        status: bloodRequest.status
      },
      filterInfo: {
        timeFilter: timeFilter,
        maxAgeHours: maxAgeHours,
        filterApplied: Object.keys(responseTimeFilter).length > 0
      },
      summary: {
        total: validResponses.length,
        tokenResponses: transformedNewResponses.filter(r => r.isRecentResponse).length,
        oldResponses: transformedOldLocations.filter(r => r.isRecentResponse).length,
        excludedOldResponses: invalidResponses.length
      }
    });
  } catch (error) {
    console.error('Error fetching donor responses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donor responses',
      error: error.message
    });
  }
});

module.exports = router;