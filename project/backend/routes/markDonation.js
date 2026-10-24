const express = require('express');
const DonorResponse = require('../models/DonorLocationResponse');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const DonationHistory = require('../models/DonationHistory');
const BloodStock = require('../models/BloodStock');
const Notification = require('../models/Notification');
const { broadcastNotification } = require('../utils/notificationStream');
const { sendDonationCertificate } = require('../services/emailService');
const mongoose = require('mongoose');
const router = express.Router();

// In-memory lock to prevent concurrent processing
const processingLock = new Set();

// Helper function to normalize phone numbers for comparison
const normalizePhone = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters and common prefixes
  let normalized = phone.toString().replace(/[^\d]/g, '');
  // Remove country code prefixes (91 for India)
  if (normalized.startsWith('91') && normalized.length > 10) {
    normalized = normalized.substring(2);
  }
  return normalized;
};

// Create Location model
let Location;
try {
  Location = mongoose.model('Location');
} catch (error) {
  const LocationSchema = new mongoose.Schema({
    address: String,
    latitude: Number,
    longitude: Number,
    userName: String,
    rollNumber: String,
    mobileNumber: String,
    donorId: String,
    requestId: String,
    token: String,
    accuracy: Number,
    timestamp: Date
  }, { collection: 'locations' });
  Location = mongoose.model('Location', LocationSchema);
}

// Mark donation
router.post('/mark-donation', async (req, res) => {
  try {
    const { donorId, donorName, requestId } = req.body;

    console.log('\n🔍 QR DONATION:', { donorId, donorName, requestId });

    if (!donorId) {
      return res.status(400).json({ success: false, error: 'Donor ID required' });
    }

    // IMMEDIATE lock check - prevent concurrent processing
    if (processingLock.has(donorId)) {
      console.log('❌ Already processing this donor');
      return res.status(400).json({ success: false, error: 'Processing in progress' });
    }

    // Add to processing lock
    processingLock.add(donorId);
    console.log('🔒 Locked:', donorId);

    // Check for ANY existing donation
    const existingDonation = await DonationHistory.findOne({
      donorId: donorId,
      status: 'completed'
    }).sort({ completedAt: -1 });

    if (existingDonation) {
      const threeMonthsInMillis = 90 * 24 * 60 * 60 * 1000;
      const timeSinceLastDonation = Date.now() - existingDonation.completedAt.getTime();

      if (timeSinceLastDonation < threeMonthsInMillis) {
        const daysSince = Math.floor(timeSinceLastDonation / (24 * 60 * 60 * 1000));
        console.log(`❌ Donated recently (${daysSince} days ago)`);
        return res.status(400).json({
          success: false,
          error: `Donor has donated recently (${daysSince} days ago). Must wait 3 months between donations.`
        });
      }
      // If > 3 months, proceed
    }

    // FIRST: Check if donor exists in the locations collection (live map users)
    console.log('Searching for donor in locations:', donorId);

    let locationRecord = await Location.findOne({ donorId: donorId });
    console.log('Mongoose Location.findOne result:', locationRecord);

    // Fallback: Try direct MongoDB query
    if (!locationRecord) {
      console.log('Trying direct MongoDB query...');
      locationRecord = await mongoose.connection.db.collection('locations').findOne({ donorId: donorId });
      console.log('Direct MongoDB query result:', locationRecord);
    }

    if (!locationRecord) {
      processingLock.delete(donorId);
      console.log('❌ Donor not found in live locations (both queries failed)');
      return res.status(404).json({
        success: false,
        error: `Donor with ID "${donorId}" not found on live map. Please ensure the donor has shared their location.`
      });
    }

    console.log('✅ Location found:', {
      userName: locationRecord.userName,
      mobileNumber: locationRecord.mobileNumber,
      address: locationRecord.address
    });

    // THEN: Try to find donor in registered donors for additional info (including blood group)
    let donorRecord = await Donor.findOne({ uniqueId: donorId });

    // If not found by uniqueId, try matching by phone or name
    if (!donorRecord && locationRecord.mobileNumber) {
      const normalizedLocationPhone = normalizePhone(locationRecord.mobileNumber);
      console.log('Searching for donor by phone:', locationRecord.mobileNumber, '-> normalized:', normalizedLocationPhone);
      
      // Get all donors and check phone match with normalization
      const allDonors = await Donor.find({});
      donorRecord = allDonors.find(d => {
        const normalizedDonorPhone = normalizePhone(d.phone);
        return normalizedDonorPhone === normalizedLocationPhone;
      });
      
      console.log('Donor found by phone:', donorRecord ? `YES - ${donorRecord.name}` : 'NO');
    }

    // If still not found, try by name
    if (!donorRecord && locationRecord.userName) {
      donorRecord = await Donor.findOne({
        name: { $regex: new RegExp('^' + locationRecord.userName.trim() + '$', 'i') }
      });
      console.log('Donor found by name:', donorRecord ? 'YES' : 'NO');
    }

    console.log('Donor record found:', donorRecord ? `${donorRecord.name} (${donorRecord.bloodGroup})` : 'NO (using location data)');

    // Get the actual requestId from the location record if available
    const actualRequestId = requestId || locationRecord.requestId;

    // Find or create blood request
    let bloodRequest = null;
    if (actualRequestId) {
      bloodRequest = await BloodRequest.findById(actualRequestId);
      console.log('Request found:', bloodRequest ? `YES (${bloodRequest.bloodGroup}, status: ${bloodRequest.status})` : 'NO');
    }

    // If no specific request found, try to find a matching pending request
    if (!bloodRequest && donorRecord?.bloodGroup) {
      bloodRequest = await BloodRequest.findOne({
        bloodGroup: donorRecord.bloodGroup,
        status: 'pending'
      }).sort({ createdAt: -1 }); // Get the most recent one

      if (bloodRequest) {
        console.log('Found matching pending request:', bloodRequest._id, 'for blood group:', bloodRequest.bloodGroup);
      }
    }

    // Still no request? Create one
    if (!bloodRequest) {
      bloodRequest = await BloodRequest.create({
        hospitalId: new mongoose.Types.ObjectId(),
        bloodGroup: donorRecord?.bloodGroup || 'O+',
        quantity: 1,
        urgency: 'medium',
        status: 'pending',  // Changed to pending so it can be fulfilled
        requiredBy: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      console.log('Created new request:', bloodRequest._id);
    }

    // ============ CHECK IF REQUEST IS ALREADY FULFILLED ============
    const isRequestFulfilled = bloodRequest.status === 'fulfilled' || 
                               bloodRequest.confirmedUnits >= bloodRequest.quantity;
    
    let excessDonation = false;
    if (isRequestFulfilled) {
      console.log('⚠️ Request already fulfilled! Redirecting to blood stock...');
      excessDonation = true;
      
      // Calculate expiry date (35 days from today for blood storage)
      const collectionDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 35);
      
      // Add to blood stock
      const donorBloodGroup = donorRecord?.bloodGroup || bloodRequest.bloodGroup;
      try {
        // Find or create blood stock for this hospital and blood group
        let bloodStock = await BloodStock.findOne({
          hospitalId: bloodRequest.hospitalId,
          bloodGroup: donorBloodGroup
        });

        if (bloodStock) {
          // Update existing stock
          bloodStock.unitsAvailable += 1;
          bloodStock.lastUpdated = collectionDate;
          if (!bloodStock.expiryDate || bloodStock.expiryDate < expiryDate) {
            // Update to the latest expiry date if it's newer
            bloodStock.expiryDate = expiryDate;
          }
          await bloodStock.save();
          console.log(`✅ Added 1 unit to existing stock. Total: ${bloodStock.unitsAvailable} units`);
        } else {
          // Create new stock entry
          bloodStock = await BloodStock.create({
            hospitalId: bloodRequest.hospitalId,
            bloodGroup: donorBloodGroup,
            unitsAvailable: 1,
            expiryDate: expiryDate,
            lastUpdated: collectionDate,
            notes: `Excess donation from fulfilled request ${bloodRequest._id}`
          });
          console.log(`✅ Created new stock entry with 1 unit`);
        }

        // Send notification to hospital
        const notificationData = {
          hospitalId: bloodRequest.hospitalId,
          type: 'success',
          title: 'Excess Donation Added to Stock',
          message: `${donorRecord ? donorRecord.name : (locationRecord.userName || donorName || 'Donor')} donated ${donorBloodGroup} blood. Request was already fulfilled, so 1 unit was added to blood stock inventory.`,
          meta: {
            donorName: donorRecord ? donorRecord.name : (locationRecord.userName || donorName || 'Unknown Donor'),
            bloodGroup: donorBloodGroup,
            bloodStockId: bloodStock._id,
            requestId: bloodRequest._id,
            collectionDate: collectionDate,
            expiryDate: expiryDate
          }
        };

        const notification = await Notification.create(notificationData);
        console.log('✅ Notification created:', notification._id);

        // Broadcast to connected clients
        broadcastNotification(notification);
        console.log('✅ Notification broadcasted via SSE');
        
      } catch (stockError) {
        console.error('❌ Error adding to blood stock:', stockError);
        // Continue anyway, we'll still record the donation
      }
    }

    // Create donation history using location data primarily
    const donation = await DonationHistory.create({
      donorId: donorRecord ? donorRecord._id.toString() : donorId,
      bloodRequestId: bloodRequest._id,
      hospitalId: bloodRequest.hospitalId,
      donorName: donorRecord ? donorRecord.name : (locationRecord.userName || donorName || 'Unknown Donor'),
      donorPhone: donorRecord ? donorRecord.phone : (locationRecord.mobileNumber || '0000000000'),
      donorBloodGroup: donorRecord ? donorRecord.bloodGroup : 'Unknown',
      status: 'completed',
      completedAt: new Date(),
      location: {
        lat: locationRecord.latitude || 0,
        lng: locationRecord.longitude || 0
      },
      address: locationRecord.address || 'Location Shared',
      notes: `Manual Entry: ${donorId}`
    });

    console.log('✅ Donation saved:', donation._id);

    // Update donor's last donation date and total donations - CRITICAL for 3-month rule and points
    if (donorRecord) {
      donorRecord.lastDonationDate = new Date();
      donorRecord.totalDonations = (donorRecord.totalDonations || 0) + 1;
      await donorRecord.save();
      console.log(`✅ Updated donor ${donorRecord.name} last donation date to ${donorRecord.lastDonationDate}`);
      console.log(`✅ Updated donor ${donorRecord.name} total donations to ${donorRecord.totalDonations}`);
    } else {
      // Try to find donor by phone from the donation history we just created
      try {
        const normalizedHistoryPhone = normalizePhone(donation.donorPhone);
        const allDonors = await Donor.find({});
        const matchedDonor = allDonors.find(d => {
          return normalizePhone(d.phone) === normalizedHistoryPhone;
        });
        
        if (matchedDonor) {
          matchedDonor.lastDonationDate = new Date();
          matchedDonor.totalDonations = (matchedDonor.totalDonations || 0) + 1;
          await matchedDonor.save();
          console.log(`✅ Updated donor ${matchedDonor.name} last donation date via phone match`);
          console.log(`✅ Updated donor ${matchedDonor.name} total donations to ${matchedDonor.totalDonations}`);
        } else {
          console.log('⚠️ Could not find donor record to update lastDonationDate and totalDonations');
        }
      } catch (err) {
        console.log('Could not update donor last donation date and total donations:', err.message);
      }
    }

    // Update blood request - increment confirmedUnits (only if not already fulfilled)
    if (!excessDonation) {
      try {
        // Atomically increment confirmedUnits
        const updatedRequest = await BloodRequest.findOneAndUpdate(
          { _id: bloodRequest._id },
          { $inc: { confirmedUnits: 1 } },
          { new: true }
        );

        if (updatedRequest.confirmedUnits >= updatedRequest.quantity) {
          updatedRequest.status = 'fulfilled';
          updatedRequest.fulfilledAt = new Date();
          updatedRequest.batchInProgress = false; // Stop batches
          await updatedRequest.save();
          console.log('✅ Request fulfilled:', updatedRequest._id, 'Status:', updatedRequest.status);
        } else {
          console.log(`✅ request confirmedUnits updated: ${updatedRequest.confirmedUnits}/${updatedRequest.quantity}`);
          // Note: We do NOT trigger sendNextBatch here. 
          // The response window checker (cron/poll) will handle it if needed.
        }
      } catch (err) {
        console.log('⚠️ Request update failed (non-critical):', err.message);
      }
    } else {
      console.log('⚠️ Skipping request update - donation added to stock instead');
    }

    // Remove from live map
    try {
      const locationRecord = await Location.findOne({ donorId: donorId });
      if (locationRecord) {
        await Location.deleteOne({ _id: locationRecord._id });
        console.log('✅ Removed from map');
      }
    } catch (err) {
      console.log('⚠️ Map removal failed (non-critical):', err.message);
    }

    // Keep lock permanently - donor has donated
    console.log('🔒 Permanently locked:', donorId, '(donated)');

    // Send donation certificate to donor's email (non-blocking)
    const sendCertificate = async () => {
      try {
        const donorEmail = donorRecord?.email || (await Donor.findOne({ 
          phone: donation.donorPhone 
        }))?.email;
        
        if (donorEmail) {
          await sendDonationCertificate(
            donorEmail,
            donation.donorName,
            donation.completedAt,
            donation.donorBloodGroup,
            donorId,
            1 // units
          );
          console.log('✅ Donation certificate sent to:', donorEmail);
        } else {
          console.log('⚠️ No email found for donor, certificate not sent');
        }
      } catch (certError) {
        console.error('❌ Error sending certificate (non-critical):', certError.message);
      }
    };
    
    // Send certificate asynchronously (don't wait for it)
    sendCertificate();

    const responseMessage = excessDonation 
      ? `Request already fulfilled! Donation from ${donation.donorName} has been added to blood stock inventory.`
      : `Donation completed for ${donation.donorName}`;

    res.json({
      success: true,
      message: responseMessage,
      excessDonation: excessDonation,
      addedToStock: excessDonation,
      donationHistory: {
        id: donation._id,
        donorName: donation.donorName,
        bloodGroup: donation.donorBloodGroup,
        completedAt: donation.completedAt
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    // Only release lock on error if donation wasn't saved
    processingLock.delete(donorId);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'API working', time: new Date() });
});

// Recent donations - Enhanced with donor name lookup
router.get('/recent-donations', async (req, res) => {
  try {
    const donations = await DonationHistory.find({ status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(50)
      .lean();

    // Get all donors for phone matching
    const allDonors = await Donor.find({}).lean();
    
    // Enhance each donation with actual donor info from DB
    const enhancedDonations = donations.map(donation => {
      // Try to find the donor by phone number
      const normalizedDonationPhone = normalizePhone(donation.donorPhone);
      const matchedDonor = allDonors.find(d => 
        normalizePhone(d.phone) === normalizedDonationPhone
      );

      if (matchedDonor) {
        // Update with actual donor info from database
        return {
          ...donation,
          donorName: matchedDonor.name,
          donorBloodGroup: matchedDonor.bloodGroup,
          donorPhone: matchedDonor.phone
        };
      }
      
      return donation;
    });

    res.json({ success: true, donations: enhancedDonations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify donor from live locations
router.get('/verify-location/:donorId', async (req, res) => {
  try {
    const { donorId } = req.params;

    console.log('\n========================================');
    console.log('=== VERIFYING DONOR LOCATION ===');
    console.log('Donor ID received:', donorId);
    console.log('Donor ID type:', typeof donorId);
    console.log('Donor ID length:', donorId.length);
    console.log('========================================\n');

    // List all locations to debug
    const allLocations = await mongoose.connection.db.collection('locations').find({}).toArray();
    console.log('Total locations in collection:', allLocations.length);
    console.log('All donor IDs in collection:', allLocations.map(l => l.donorId));

    // Try direct MongoDB query first with exact match
    const directQuery = await mongoose.connection.db.collection('locations').findOne({ donorId: donorId });
    console.log('Direct MongoDB query result:', directQuery ? 'FOUND' : 'NOT FOUND');
    if (directQuery) {
      console.log('Found location:', JSON.stringify(directQuery, null, 2));
    }

    // Check if donor exists in locations (live map) using Mongoose
    const locationRecord = await Location.findOne({ donorId: donorId });
    console.log('Mongoose query result:', locationRecord ? 'FOUND' : 'NOT FOUND');

    if (!locationRecord && !directQuery) {
      console.log('❌ Not found in either query');
      console.log('Searched for donorId:', donorId);
      return res.status(404).json({
        success: false,
        message: `Donor with ID "${donorId}" not found on live map. Please ensure the donor has shared their location.`
      });
    }

    const location = locationRecord || directQuery;
    console.log('✅ Using location data:', {
      donorId: location.donorId,
      userName: location.userName,
      mobileNumber: location.mobileNumber
    });

    // Also try to get donor details from registered donors
    const donorRecord = await Donor.findOne({ uniqueId: donorId }, { password: 0 });
    console.log('Donor record found:', donorRecord ? 'YES' : 'NO');

    res.json({
      success: true,
      location: {
        donorId: location.donorId,
        userName: location.userName,
        rollNumber: location.rollNumber,
        mobileNumber: location.mobileNumber,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.timestamp
      },
      donor: donorRecord ? {
        name: donorRecord.name,
        email: donorRecord.email,
        phone: donorRecord.phone,
        bloodGroup: donorRecord.bloodGroup,
        rollNumber: donorRecord.rollNumber
      } : null
    });
  } catch (error) {
    console.error('❌ Error verifying donor location:', error);
    res.status(500).json({ success: false, message: 'Failed to verify donor' });
  }
});

module.exports = router;