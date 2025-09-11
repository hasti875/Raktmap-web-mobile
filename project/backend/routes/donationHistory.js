const express = require('express');
const router = express.Router();
const DonationHistory = require('../models/DonationHistory');
const BloodRequest = require('../models/BloodRequest');

// Get all donation history records (for frontend display)
router.get('/donation-history', async (req, res) => {
  try {
    const donationHistory = await DonationHistory.find({}).sort({ acceptedAt: -1 });
    res.json({
      success: true,
      donationHistory
    });
  } catch (error) {
    console.error('Error fetching all donation history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching all donation history',
      error: error.message
    });
  }
});

// Accept a donor for a blood request
router.post('/accept-donor', async (req, res) => {
  try {
    const { 
      donorId, 
      bloodRequestId, 
      donorName, 
      donorPhone, 
      donorBloodGroup, 
      location, 
      address,
      status = 'accepted', // Default to accepted, but allow override
      acceptedAt,
      completedAt,
      notes
    } = req.body;
    
    console.log('Accept donor request:', req.body);
    
    // Validate required fields (bloodRequestId is now optional)
    if (!donorId || !donorName || !donorPhone || !donorBloodGroup || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // If bloodRequestId is provided, check if it exists and set hospitalId
    let hospitalId = null;
    if (bloodRequestId) {
      const bloodRequest = await BloodRequest.findById(bloodRequestId);
      if (!bloodRequest) {
        return res.status(404).json({
          success: false,
          message: 'Blood request not found'
        });
      }
      hospitalId = bloodRequest.hospitalId;
      // Check if donor already accepted for this request
      const existingAcceptance = await DonationHistory.findOne({
        donorId,
        bloodRequestId,
        status: 'accepted'
      });
      if (existingAcceptance) {
        return res.status(400).json({
          success: false,
          message: 'Donor already accepted for this blood request'
        });
      }
    }
    // Create new donation history entry
    const donationHistory = new DonationHistory({
      donorId,
      bloodRequestId,
      hospitalId,
      donorName,
      donorPhone,
      donorBloodGroup,
      status: status,
      acceptedAt: acceptedAt ? new Date(acceptedAt) : (status === 'accepted' || status === 'completed' ? new Date() : null),
      completedAt: completedAt ? new Date(completedAt) : (status === 'completed' ? new Date() : null),
      location,
      address: address || 'Address not provided',
      notes: notes || ''
    });

    await donationHistory.save();

    console.log('Donor accepted successfully:', donationHistory);

    res.json({
      success: true,
      message: 'Donor accepted successfully',
      donationHistory
    });

  } catch (error) {
    console.error('Error accepting donor:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting donor',
      error: error.message
    });
  }
});

// Get donation history for a hospital
router.get('/donation-history/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    const donationHistory = await DonationHistory.find({
      hospitalId,
      status: 'accepted'
    }).populate('bloodRequestId').sort({ acceptedAt: -1 });

    res.json({
      success: true,
      donationHistory
    });

  } catch (error) {
    console.error('Error fetching donation history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching donation history',
      error: error.message
    });
  }
});

// Get all accepted donors for a specific blood request
router.get('/accepted-donors/:bloodRequestId', async (req, res) => {
  try {
    const { bloodRequestId } = req.params;
    
    const acceptedDonors = await DonationHistory.find({
      bloodRequestId,
      status: 'accepted'
    }).sort({ acceptedAt: -1 });

    res.json({
      success: true,
      acceptedDonors
    });

  } catch (error) {
    console.error('Error fetching accepted donors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching accepted donors',
      error: error.message
    });
  }
});

// Mark donation as completed for a specific donor and request
router.post('/mark-donation-completed', async (req, res) => {
  try {
    const { donorId, requestId, donorName, donorPhone, donorBloodGroup, location, address } = req.body;
    
    console.log('Mark donation completed request:', req.body);
    
    // Validate required fields
    if (!donorId || !requestId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: donorId and requestId'
      });
    }

    // Check if this donation already exists
    const existingDonation = await DonationHistory.findOne({ 
      donorId, 
      bloodRequestId: requestId 
    });

    let donation;
    if (existingDonation) {
      // Update existing record to completed
      existingDonation.status = 'completed';
      existingDonation.completedAt = new Date();
      
      donation = await existingDonation.save();
    } else {
      // Create new completed donation record
      donation = new DonationHistory({
        donorId,
        bloodRequestId: requestId,
        donorName,
        donorPhone,
        donorBloodGroup,
        location,
        address,
        status: 'completed',
        acceptedAt: new Date(), // Mark as accepted and completed at the same time
        completedAt: new Date(),
        notes: 'Marked as completed from live map'
      });

      await donation.save();
    }

    // Update the blood request status to 'fulfilled'
    const bloodRequest = await BloodRequest.findById(requestId);
    if (bloodRequest) {
      bloodRequest.status = 'fulfilled';
      await bloodRequest.save();
      console.log(`Updated blood request ${requestId} status to fulfilled`);
    } else {
      console.log(`Blood request ${requestId} not found`);
    }

    return res.status(201).json({
      success: true,
      message: 'Donation completed and blood request fulfilled successfully',
      donation,
      bloodRequestUpdated: !!bloodRequest
    });

  } catch (error) {
    console.error('Error marking donation as completed:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error while marking donation as completed',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
