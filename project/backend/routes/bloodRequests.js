const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const ResponseToken = require('../models/ResponseToken');
const { sendSMS } = require('../services/smsService');
const Notification = require('../models/Notification');
const { broadcastNotification } = require('../utils/notificationStream');

// Blood compatibility chart - who can receive from whom
const bloodCompatibilityChart = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
};

// Function to check blood compatibility
function isBloodCompatible(recipientBloodGroup, donorBloodGroup) {
    // Normalize blood groups by removing spaces and converting to uppercase
    const normalizedRecipient = recipientBloodGroup.replace(/\s+/g, '').toUpperCase();
    const normalizedDonor = donorBloodGroup.replace(/\s+/g, '').toUpperCase();
    
    // Check if donor's blood group is in the list of compatible groups for the recipient
    return bloodCompatibilityChart[normalizedRecipient]?.includes(normalizedDonor) || false;
}

// Create a new blood request
router.post('/', async (req, res) => {
  try {
    const { bloodGroup, quantity, urgency, requiredBy, description, patientAge, patientCondition } = req.body;
    const hospital = req.user; // From JWT token

    // Create and save the blood request
    const bloodRequest = new BloodRequest({
      hospitalId: hospital.id,
      bloodGroup,
      quantity,
      urgency,
      requiredBy,
      description,
      patientAge,
      patientCondition
    });

    await bloodRequest.save();

    // Create notification for hospital
    try {
      const doc = await Notification.create({
        hospitalId: hospital.id,
        type: 'info',
        title: 'Blood Request Created',
        message: `${quantity} unit(s) of ${bloodGroup} requested (urgency: ${urgency})`,
        meta: { bloodRequestId: bloodRequest._id }
      });
      broadcastNotification(doc);
    } catch (e) { console.error('Failed to create notification:', e.message); }

    // Find compatible donors
    const allDonors = await Donor.find({});
    const compatibleDonors = allDonors.filter(donor => {
      const donorBloodGroup = donor.bloodGroup || donor["Blood Group"];
      return donorBloodGroup && isBloodCompatible(bloodGroup, donorBloodGroup);
    });

    let smsSuccessCount = 0;

    // Send SMS to compatible donors
    for (const donor of compatibleDonors) {
      const donorPhone = donor.phoneNumber || donor["Mobile No"] || donor.phone;
      const donorName = donor["Student Name"] || donor.name || donor._id;

      if (!donorPhone) {
        console.warn(`No phone number for donor: ${donorName}`);
        continue;
      }

      try {
        // Generate tracking token
        const responseToken = Math.random().toString(36).substr(2, 8);

        // Store token mapping
        await ResponseToken.create({
          token: responseToken,
          requestId: bloodRequest._id,
          donorId: donor._id
        });

        // Create SMS message with tracking link
        const message = `Urgent: ${quantity} units ${bloodGroup} needed at ${hospital.name}. ` +
          `Urgency: ${urgency}. ` +
          `Respond: https://donor-location-tracker.onrender.com/r/${responseToken}`;
        
        await sendSMS(donorPhone, message);
        smsSuccessCount++;
        
        console.log(`SMS sent to donor ${donorName} (${donorPhone})`);

        // Create success notification
        const notif = await Notification.create({
          hospitalId: hospital.id,
          type: 'info',
          title: 'SMS Sent',
          message: `SMS sent to ${donorName} (${bloodGroup})`,
          read: false,
          meta: { donorId: donor._id, bloodRequestId: bloodRequest._id }
        });
        broadcastNotification(notif);
      } catch (error) {
        console.error(`Failed to send SMS to donor ${donorName}:`, error.message);
        
        // Create error notification
        try {
          const notif = await Notification.create({
            hospitalId: hospital.id,
            type: 'error',
            title: 'SMS Failed',
            message: `Failed to send SMS to ${donorName}`,
            read: false,
            meta: { donorId: donor._id, bloodRequestId: bloodRequest._id }
          });
          broadcastNotification(notif);
        } catch (e) { console.error('Failed to create error notification:', e.message); }
      }
    }

    // Create summary notification
    try {
      const notif = await Notification.create({
        hospitalId: hospital.id,
        type: 'success',
        title: 'SMS Dispatch Complete',
        message: `${smsSuccessCount}/${compatibleDonors.length} SMS delivered for ${bloodGroup}`,
        read: false,
        meta: { bloodRequestId: bloodRequest._id }
      });
      broadcastNotification(notif);
    } catch (e) { console.error('Failed to create summary notification:', e.message); }

    // Send response
    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      bloodRequest,
      smsStatus: {
        totalDonors: compatibleDonors.length,
        smsDelivered: smsSuccessCount,
        bloodGroup
      }
    });

  } catch (error) {
    console.error('Error in blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process blood request',
      error: error.message
    });
  }
});

// Get all blood requests for a hospital (for dashboard)
router.get('/hospital', async (req, res) => {
  try {
    const hospital = req.user; // From JWT token
    
    const bloodRequests = await BloodRequest.find({ hospitalId: hospital.id })
      .sort({ createdAt: -1 })
      .select('_id bloodGroup quantity urgency status createdAt requiredBy description');
    
    res.json({
      success: true,
      bloodRequests
    });
  } catch (error) {
    console.error('Error fetching hospital blood requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood requests'
    });
  }
});

// Get all blood requests for donation history (public endpoint)
router.get('/all', async (req, res) => {
  try {
    const bloodRequests = await BloodRequest.find({})
      .sort({ createdAt: -1 })
      .select('_id bloodGroup quantity urgency status createdAt requiredBy description hospitalId');
    
    res.json({
      success: true,
      bloodRequests
    });
  } catch (error) {
    console.error('Error fetching all blood requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood requests'
    });
  }
});

// PUT /blood-requests/:id - Update a blood request
router.put('/:id', async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!bloodRequest) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }
    
    // Create notification for blood request update
    try {
      const notif = await Notification.create({
        hospitalId: bloodRequest.hospitalId,
        type: 'info',
        title: 'Blood Request Updated',
        message: `Blood request for ${bloodRequest.bloodGroup} (${bloodRequest.quantity} units) was updated`,
        read: false,
        meta: { bloodRequestId: bloodRequest._id }
      });
      broadcastNotification(notif);
    } catch (e) { console.error('Failed to create blood request update notification:', e.message); }
    
    res.json({ success: true, message: 'Blood request updated successfully', bloodRequest });
  } catch (error) {
    console.error('Error updating blood request:', error);
    res.status(500).json({ success: false, message: 'Failed to update blood request' });
  }
});

// DELETE /blood-requests/:id - Delete a blood request
router.delete('/:id', async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findByIdAndDelete(req.params.id);
    if (!bloodRequest) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }
    
    // Create notification for blood request deletion
    try {
      const notif = await Notification.create({
        hospitalId: bloodRequest.hospitalId,
        type: 'warning',
        title: 'Blood Request Deleted',
        message: `Blood request for ${bloodRequest.bloodGroup} (${bloodRequest.quantity} units) was deleted`,
        read: false,
        meta: { bloodRequestId: bloodRequest._id }
      });
      broadcastNotification(notif);
    } catch (e) { console.error('Failed to create blood request deletion notification:', e.message); }
    
    res.json({ success: true, message: 'Blood request deleted successfully' });
  } catch (error) {
    console.error('Error deleting blood request:', error);
    res.status(500).json({ success: false, message: 'Failed to delete blood request' });
  }
});

module.exports = router;
