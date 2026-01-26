const mongoose = require('mongoose');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const { broadcastNotification } = require('./notificationStream');

let changeStream = null;

async function startLocationWatcher() {
    try {
        console.log('🔍 Starting MongoDB Change Stream for locations collection...');

        const locationsCollection = mongoose.connection.db.collection('locations');

        // Watch for insert operations only
        changeStream = locationsCollection.watch([
            { $match: { operationType: 'insert' } }
        ]);

        console.log('✅ Change Stream started - watching for new locations');

        changeStream.on('change', async (change) => {
            try {
                console.log('\n🆕 NEW LOCATION DETECTED via Change Stream!');
                const newLocation = change.fullDocument;

                console.log('Location data:', {
                    userName: newLocation.userName,
                    requestId: newLocation.requestId,
                    timestamp: newLocation.timestamp
                });

                // Get blood request and donor info
                const bloodRequest = await BloodRequest.findById(newLocation.requestId);
                if (!bloodRequest) {
                    console.log('⚠️ Blood request not found, skipping notification');
                    return;
                }

                // Match donor by mobile number only
                let donor = null;
                if (newLocation.mobileNumber) {
                    const cleanPhone = newLocation.mobileNumber.replace(/\D/g, '');
                    console.log('Searching for donor with phone:', newLocation.mobileNumber);
                    console.log('Cleaned phone number:', cleanPhone);

                    donor = await Donor.findOne({
                        $or: [
                            { phone: newLocation.mobileNumber },
                            { phone: `+91${cleanPhone}` },
                            { phone: cleanPhone },
                            { phone: `+${cleanPhone}` }
                        ]
                    });

                    if (donor) {
                        console.log('✅ Donor found by phone:', donor.name, donor.bloodGroup);
                    } else {
                        console.log('⚠️ No donor found with phone number:', newLocation.mobileNumber);
                    }
                } else {
                    console.log('⚠️ No mobile number in location data');
                }

                const donorName = donor ? donor.name : (newLocation.userName || 'Unknown Donor');
                const donorBloodGroup = donor ? donor.bloodGroup : 'Unknown';

                // Create and broadcast ephemeral notification
                const ephemeralNotification = {
                    _id: `ephemeral-${Date.now()}`,
                    hospitalId: bloodRequest.hospitalId,
                    type: 'success',
                    title: '📍 New Donor Location Shared',
                    message: `${donorName} (${donorBloodGroup}) has shared their location for your ${bloodRequest.bloodGroup} blood request`,
                    read: false,
                    createdAt: new Date(),
                    meta: {
                        donorName: donorName,
                        donorBloodGroup: donorBloodGroup,
                        requestBloodGroup: bloodRequest.bloodGroup,
                        latitude: newLocation.latitude,
                        longitude: newLocation.longitude,
                        locationId: change.documentKey._id.toString(),
                        ephemeral: true,
                        source: 'change_stream'
                    },
                    donorId: donor ? donor._id : null,
                    bloodRequestId: bloodRequest._id
                };

                console.log('📡 Broadcasting notification from Change Stream...');
                console.log('Hospital ID:', bloodRequest.hospitalId);
                broadcastNotification(ephemeralNotification);
                console.log('✅ Notification broadcasted successfully!\n');

            } catch (error) {
                console.error('❌ Error processing location change:', error.message);
            }
        });

        changeStream.on('error', (error) => {
            console.error('❌ Change Stream error:', error.message);
            // Attempt to restart after error
            setTimeout(() => {
                console.log('🔄 Attempting to restart Change Stream...');
                startLocationWatcher();
            }, 5000);
        });

    } catch (error) {
        console.error('❌ Failed to start Change Stream:', error.message);
    }
}

function stopLocationWatcher() {
    if (changeStream) {
        changeStream.close();
        console.log('🛑 Location watcher stopped');
    }
}

module.exports = { startLocationWatcher, stopLocationWatcher };
