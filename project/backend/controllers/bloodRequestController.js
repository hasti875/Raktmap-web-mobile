const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const ResponseToken = require('../models/ResponseToken');
const Notification = require('../models/Notification');
const { sendSMS, getSMSTemplate, formatSMSMessage } = require('../services/smsService');
const { broadcastNotification } = require('../utils/notificationStream');

// Blood compatibility chart - who each recipient blood type can receive from (donors)
const bloodRecipientCompatibilityChart = {
    'A-': ['A-', 'O-'],                                    // A- can receive from A-, O-
    'A+': ['A+', 'A-', 'O+', 'O-'],                       // A+ can receive from A+, A-, O+, O-
    'B-': ['B-', 'O-'],                                    // B- can receive from B-, O-
    'B+': ['B+', 'B-', 'O+', 'O-'],                       // B+ can receive from B+, B-, O+, O-
    'AB-': ['AB-', 'A-', 'B-', 'O-'],                     // AB- can receive from AB-, A-, B-, O-
    'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // AB+ universal recipient
    'O-': ['O-'],                                          // O- can only receive from O-
    'O+': ['O+', 'O-']                                     // O+ can receive from O+, O-
};

// Function to check blood compatibility - can this recipient receive from this donor?
function isBloodCompatible(recipientBloodGroup, donorBloodGroup) {
    // Normalize blood groups by removing spaces and converting to uppercase
    const normalizedRecipient = recipientBloodGroup.replace(/\s+/g, '').toUpperCase();
    const normalizedDonor = donorBloodGroup.replace(/\s+/g, '').toUpperCase();
    
    console.log(`🔬 Compatibility check: Recipient ${recipientBloodGroup} (normalized: ${normalizedRecipient}) <- Donor ${donorBloodGroup} (normalized: ${normalizedDonor})`);
    console.log(`🔬 Compatible donors for ${normalizedRecipient}: ${bloodRecipientCompatibilityChart[normalizedRecipient] || 'NONE FOUND'}`);
    
    // Check if this recipient can receive from this donor
    const isCompatible = bloodRecipientCompatibilityChart[normalizedRecipient]?.includes(normalizedDonor) || false;
    console.log(`🔬 Result: ${isCompatible}`);
    
    return isCompatible;
}

// Create a new blood request
const createBloodRequest = async (req, res) => {
  try {
    const { bloodGroup, quantity, urgency, requiredBy, description, patientAge, patientCondition } = req.body;
    const hospital = req.user; // From JWT token

    console.log('\n🩸 === CREATING NEW BLOOD REQUEST ===');
    console.log('Hospital:', hospital.name);
    console.log('Blood Group:', bloodGroup);
    console.log('Quantity:', quantity);
    console.log('Urgency:', urgency);

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
    console.log('✅ Blood request saved with ID:', bloodRequest._id);

    // Create notification for hospital
    try {
      const notification = await Notification.create({
        hospitalId: hospital.id,
        type: 'info',
        title: 'Blood Request Created',
        message: `${quantity} unit(s) of ${bloodGroup} requested (urgency: ${urgency})`,
        meta: { bloodRequestId: bloodRequest._id }
      });
      broadcastNotification(notification);
    } catch (e) { 
      console.error('Failed to create notification:', e.message); 
    }

    // Find compatible donors
    const allDonors = await Donor.find({});
    console.log(`\n🔍 === BLOOD COMPATIBILITY MATCHING ===`);
    console.log(`Recipient needs: ${bloodGroup}`);
    console.log(`Can receive from: ${bloodRecipientCompatibilityChart[bloodGroup]?.join(', ') || 'Unknown blood group'}`);
    console.log(`Total donors found in database: ${allDonors.length}`);
    
    // Log all donors for debugging
    console.log('\n📋 All donors in database:');
    allDonors.forEach((donor, index) => {
      const donorBloodGroup = donor.bloodGroup || donor["Blood Group"];
      console.log(`${index + 1}. ${donor.name} - Blood Group: ${donorBloodGroup} - Phone: ${donor.phone || donor.phoneNumber || donor["Mobile No"] || 'N/A'}`);
    });
    
    const compatibleDonors = allDonors.filter(donor => {
      const donorBloodGroup = donor.bloodGroup || donor["Blood Group"];
      const isCompatible = donorBloodGroup && isBloodCompatible(bloodGroup, donorBloodGroup);
      
      console.log(`🔍 Checking ${donor.name} (${donorBloodGroup}) -> Compatible: ${isCompatible}`);
      
      if (donorBloodGroup && isCompatible) {
        console.log(`✅ Compatible: ${donor.name} (${donorBloodGroup}) can donate to ${bloodGroup}`);
      } else if (donorBloodGroup) {
        console.log(`❌ Not compatible: ${donor.name} (${donorBloodGroup}) cannot donate to ${bloodGroup}`);
      } else {
        console.log(`⚠️ Missing blood group: ${donor.name} has no blood group specified`);
      }
      
      return isCompatible;
    });
    
    console.log(`Total compatible donors found: ${compatibleDonors.length}`);

    console.log(`\n🩸 SMS DISPATCH STARTED 🩸`);
    console.log(`Hospital: ${hospital.name}`);
    console.log(`Blood Group Needed: ${bloodGroup}`);
    console.log(`Urgency Level: ${urgency}`);
    console.log(`Total Compatible Donors Found: ${compatibleDonors.length}`);
    console.log(`-`.repeat(80));

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

        // Create SMS message with tracking link - customized for urgency
        let urgencyText;
        if (urgency === 'pregnancy') {
          urgencyText = 'PREGNANCY EMERGENCY - URGENT';
        } else if (urgency === 'high') {
          urgencyText = 'HIGH PRIORITY - EMERGENCY';
        } else if (urgency === 'medium') {
          urgencyText = 'MEDIUM PRIORITY';
        } else {
          urgencyText = 'LOW PRIORITY';
        }
        
        // Get SMS template based on urgency
        const priority = (urgency === 'high' || urgency === 'pregnancy') ? 'high' : 'normal';
        const smsTemplate = await getSMSTemplate(priority);
        
        // Template variables for message formatting
        const templateVars = {
          hospital: hospital.name,
          bloodType: bloodGroup,
          quantity: quantity,
          urgency: urgencyText,
          donorName: donorName,
          // UPDATED: Include both requestId and donorId in the URL
          responseUrl: `https://donor-location-tracker.onrender.com/donor-location/${bloodRequest._id}`,
          
        };
        
        // Special handling for pregnancy emergencies
        let message;
        if (urgency === 'pregnancy') {
          message = `PREGNANCY EMERGENCY: ${quantity} units ${bloodGroup} blood needed URGENTLY for pregnant patient at ${hospital.name}. ` +
            ` Your response will help mother and child. ` +
            `Please respond: ${templateVars.responseUrl}`;
        } else {
          // Use dynamic template with variable replacement
          message = formatSMSMessage(smsTemplate, templateVars);
          
          // Add response URL if not already in template
          if (!message.includes('http') && !message.includes('{responseUrl}')) {
            message += ` Respond: ${templateVars.responseUrl}`;
          }
        }
        
        console.log(`🔍 Debug - Sending SMS for urgency: ${urgency}`);
        console.log(`📝 Message content: ${message.substring(0, 100)}...`);
        console.log(`📏 Message length: ${message.length} characters`);
        
        const smsResult = await sendSMS(donorPhone, message);
        
        if (smsResult.success) {
          smsSuccessCount++;
          
          // Enhanced logging with detailed user information
          console.log(`\n📤 ===== SMS SENT SUCCESSFULLY =====`);
          console.log(`👤 Donor Name: ${donorName}`);
          console.log(`🩸 Blood Group: ${donor.bloodGroup}`);
          console.log(`📞 Phone Number: ${donorPhone}`);
          console.log(`🆔 Donor ID: ${donor._id}`);
          console.log(`📧 Email: ${donor.email || 'Not provided'}`);
          console.log(`📍 Location: ${donor.location || 'Not provided'}`);
          console.log(`🏥 Hospital: ${hospital.name}`);
          console.log(`🚨 Urgency: ${urgency.toUpperCase()}`);
          console.log(`🎯 Requested Blood: ${bloodGroup}`);
          console.log(`📊 Twilio SID: ${smsResult.sid}`);
          console.log(`=======================================\n`);

          // Create success notification
          try {
            const notif = await Notification.create({
              hospitalId: hospital.id,
              type: 'info',
              title: 'SMS Sent',
              message: `SMS sent to ${donorName} (${donorPhone})`,
              meta: { 
                bloodRequestId: bloodRequest._id,
                donorId: donor._id,
                smsId: smsResult.sid
              }
            });
            broadcastNotification(notif);
          } catch (e) { 
            console.error('Failed to create SMS notification:', e.message); 
          }
        } else {
          console.error(`❌ Failed to send SMS to ${donorName} (${donorPhone}):`, smsResult.error);
          
          // Create error notification
          try {
            const errorNotif = await Notification.create({
              hospitalId: hospital.id,
              type: 'error',
              title: 'SMS Failed',
              message: `Failed to send SMS to ${donorName}: ${smsResult.error}`,
              meta: { 
                bloodRequestId: bloodRequest._id,
                donorId: donor._id,
                error: smsResult.error
              }
            });
            broadcastNotification(errorNotif);
          } catch (e) { 
            console.error('Failed to create error notification:', e.message); 
          }
        }
        
      } catch (error) {
        console.error(`Error processing donor ${donorName}:`, error);
      }
    }

    console.log(`\n📊 ===== SMS DISPATCH SUMMARY =====`);
    console.log(`Total Compatible Donors: ${compatibleDonors.length}`);
    console.log(`SMS Successfully Sent: ${smsSuccessCount}`);
    console.log(`SMS Failed: ${compatibleDonors.length - smsSuccessCount}`);
    console.log(`Success Rate: ${((smsSuccessCount / compatibleDonors.length) * 100).toFixed(1)}%`);
    console.log(`===================================\n`);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Blood request created and SMS notifications sent successfully',
      data: {
        requestId: bloodRequest._id,
        bloodGroup: bloodRequest.bloodGroup,
        quantity: bloodRequest.quantity,
        urgency: bloodRequest.urgency,
        compatibleDonors: compatibleDonors.length,
        smsSuccessCount,
        smsFailCount: compatibleDonors.length - smsSuccessCount
      }
    });

  } catch (error) {
    console.error('Error in blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blood request',
      error: error.message
    });
  }
};

// Get all blood requests
const getAllBloodRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({})
      .populate('hospitalId', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching blood requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood requests',
      error: error.message
    });
  }
};

// Get blood request by ID
const getBloodRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findById(id).populate('hospitalId', 'name');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood request',
      error: error.message
    });
  }
};

module.exports = {
  createBloodRequest,
  getAllBloodRequests,
  getBloodRequestById,
  isBloodCompatible
};
