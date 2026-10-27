const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const ResponseToken = require('../models/ResponseToken');
const Notification = require('../models/Notification');
const { sendSMS, getSMSTemplate, formatSMSMessage } = require('../services/smsService');
const { broadcastNotification } = require('../utils/notificationStream');



// Send next batch of SMS
const sendNextBatch = async (requestId) => {
  try {
    const request = await BloodRequest.findById(requestId).populate('hospitalId');
    if (!request) return;

    // Check if request is already fulfilled or cancelled
    if (request.status === 'fulfilled' || request.status === 'cancelled') {
      return;
    }

    // Check if queue is empty
    if (request.remainingDonorsQueue.length === 0) {
      console.log(`[Batch] No more donors in queue for request ${requestId}`);
      // Optional: Mark as completed if no donors left? Or just leave as pending.
      return;
    }

    const batchSize = request.batchSize || 1;

    // Extract batch
    const nextBatchIds = request.remainingDonorsQueue.slice(0, batchSize);

    // Remove from queue and add to notified
    request.remainingDonorsQueue = request.remainingDonorsQueue.slice(batchSize);
    request.notifiedDonors.push(...nextBatchIds);

    // Set batch tracking
    request.batchSentAt = new Date();
    request.batchInProgress = true;

    await request.save();

    console.log(`\n📦 === SENDING BATCH SMS ===`);
    console.log(`Request ID: ${requestId}`);
    console.log(`Batch Size: ${nextBatchIds.length}`);
    console.log(`Remaining in queue: ${request.remainingDonorsQueue.length}`);

    // Fetch donor details
    const donors = await Donor.find({ _id: { $in: nextBatchIds } });
    const hospital = request.hospitalId;

    let smsSuccessCount = 0;

    // Process batch with staggered delay for WhatsApp anti-ban compliance
    for (let i = 0; i < donors.length; i++) {
      const donor = donors[i];
      try {
        const donorPhone = donor.phoneNumber || donor["Mobile No"] || donor.phone;
        const donorName = donor["Student Name"] || donor.name || donor._id;

        if (!donorPhone) continue;

        // Generate tracking token
        const responseToken = Math.random().toString(36).substr(2, 8);

        await ResponseToken.create({
          token: responseToken,
          requestId: request._id,
          donorId: donor._id
        });

        // Prepare SMS/WhatsApp content
        let urgencyText;
        if (request.urgency === 'pregnancy') urgencyText = 'PREGNANCY EMERGENCY - URGENT';
        else if (request.urgency === 'high') urgencyText = 'HIGH PRIORITY - EMERGENCY';
        else if (request.urgency === 'medium') urgencyText = 'MEDIUM PRIORITY';
        else urgencyText = 'LOW PRIORITY';

        const priority = (request.urgency === 'high' || request.urgency === 'pregnancy') ? 'high' : 'normal';
        const smsTemplate = await getSMSTemplate(priority);

        const templateVars = {
          hospital: hospital.name,
          bloodType: request.bloodGroup,
          quantity: request.quantity,
          urgency: urgencyText,
          donorName: donorName,
          responseUrl: `https://donor-tracker-msrl.vercel.app/${request._id}`,
        };

        let message;
        if (request.urgency === 'pregnancy') {
          message = `PREGNANCY EMERGENCY: ${request.quantity} units ${request.bloodGroup} blood needed URGENTLY for pregnant patient at ${hospital.name}. Please respond: ${templateVars.responseUrl}`;
        } else {
          message = formatSMSMessage(smsTemplate, templateVars);
          if (!message.includes('http') && !message.includes('{responseUrl}')) {
            message += ` Respond: ${templateVars.responseUrl}`;
          }
        }

        const smsResult = await sendSMS(donorPhone, message);

        if (smsResult.success) {
          smsSuccessCount++;
          // Create success notification
          try {
            const notif = await Notification.create({
              hospitalId: hospital._id,
              type: 'info',
              title: 'SMS Sent (Batch)',
              message: `WhatsApp message sent to ${donorName} (${donorPhone})`,
              meta: { bloodRequestId: request._id, donorId: donor._id, smsId: smsResult.sid }
            });
            broadcastNotification(notif);
          } catch (e) {
            console.error('Failed to create notification', e);
          }
        }

        // Add 1.5s delay between messages if more recipients remain (anti-ban practice)
        if (i < donors.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (err) {
        console.error(`Failed to process donor ${donor._id} in batch:`, err);
      }
    }

    console.log(`✅ Batch complete. Sent: ${smsSuccessCount}/${donors.length}`);

  } catch (error) {
    console.error('Error in sendNextBatch:', error);
  }
};

// Create a new blood request
const createBloodRequest = async (req, res) => {
  try {
    const { bloodGroup, quantity, urgency, requiredBy, description, patientAge, patientCondition } = req.body;
    const userFromToken = req.user; // From JWT token - contains { id, email, role, name }

    console.log('\n🩸 === CREATING NEW BLOOD REQUEST (BATCH MODE) ===');
    console.log('User from token:', userFromToken);
    console.log('Blood Group:', bloodGroup);

    // Fetch the full hospital document from database
    const hospital = await Hospital.findById(userFromToken.id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    console.log('Hospital:', hospital.name);

    // Create and save the blood request
    const bloodRequest = new BloodRequest({
      hospitalId: hospital._id,
      bloodGroup,
      quantity,
      urgency,
      requiredBy,
      description,
      patientAge,
      patientCondition,
      confirmedUnits: 0,
      batchSize: 1, // 1 donor per batch for testing
      responseWindow: 2, // 2 minutes window for testing
      batchInProgress: false
    });

    // Find eligible donors first - only those with role='donor' and willing to donate
    const allDonors = await Donor.find({
      role: 'donor',
      willingToDonate: true,
      isActive: true
    });

    // Filter logic (Exact match + 3 months rule)
    const matchingDonors = allDonors.filter(donor => {
      const donorBloodGroup = donor.bloodGroup || donor["Blood Group"];

      // 3 month rule
      if (donor.lastDonationDate) {
        const lastDonation = new Date(donor.lastDonationDate);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        if (lastDonation > threeMonthsAgo) return false;
      }

      // Blood group match
      const normalizedRequested = bloodGroup.replace(/\s+/g, '').toUpperCase();
      const normalizedDonor = donorBloodGroup ? donorBloodGroup.replace(/\s+/g, '').toUpperCase() : '';
      return normalizedDonor === normalizedRequested;
    });

    // Sort donors (optional - can be by distance or last donation, simple sort by ID or name for now)
    matchingDonors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Add donors to queue
    const donorIds = matchingDonors.map(d => d._id);
    bloodRequest.remainingDonorsQueue = donorIds;

    console.log(`Found ${donorIds.length} eligible donors. Added to queue.`);

    await bloodRequest.save();
    console.log('✅ Blood request saved with ID:', bloodRequest._id);
    console.log('✅ Blood request hospitalId:', bloodRequest.hospitalId);
    console.log('✅ JWT user id:', userFromToken.id);
    console.log('✅ Hospital document _id:', hospital._id.toString());

    // Initial Notification
    try {
      const notification = await Notification.create({
        hospitalId: hospital._id,
        type: 'info',
        title: 'Blood Request Created',
        message: `${quantity} unit(s) of ${bloodGroup} requested. Queued ${donorIds.length} donors.`,
        meta: { bloodRequestId: bloodRequest._id }
      });
      broadcastNotification(notification);
      console.log('✅ Notification broadcasted for hospital:', hospital._id);
    } catch (e) {
      console.error('Failed to create notification:', e.message);
    }

    // Trigger first batch asynchronously
    sendNextBatch(bloodRequest._id);

    // Return success response immediately
    res.status(201).json({
      success: true,
      message: 'Blood request created. SMS batch processing started.',
      data: {
        requestId: bloodRequest._id,
        bloodGroup: bloodRequest.bloodGroup,
        quantity: bloodRequest.quantity,
        matchingDonors: matchingDonors.length,
        status: 'processing'
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
  sendNextBatch
};