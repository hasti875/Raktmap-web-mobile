const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');
const bcrypt = require('bcryptjs');
const { requireUserOrDonor } = require('../middleware/security');

// POST - Convert user to donor (start willing to donate)
router.post('/become-donor', requireUserOrDonor, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bloodGroup, latitude, longitude, address, city, state } = req.body;

    // Validate blood group is provided
    if (!bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Blood group is required to become a donor'
      });
    }

    // Validate location is provided (required for donors to appear on map)
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location is required to become a donor. Please allow location access.'
      });
    }

    // Validate blood group format
    const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodGroups.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood group'
      });
    }

    // Find the user in Donor collection
    const user = await Donor.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already a donor
    if (user.role === 'donor' && user.willingToDonate) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered as a donor'
      });
    }

    // Update user to donor role with location
    user.role = 'donor';
    user.willingToDonate = true;
    user.bloodGroup = bloodGroup;
    user.latitude = latitude;
    user.longitude = longitude;
    user.isActive = true;

    // Update optional address fields if provided
    if (address) user.address = address;
    if (city) user.city = city;
    if (state) user.state = state;

    await user.save();

    res.json({
      success: true,
      message: 'Successfully registered as a donor! You will now receive blood donation requests.',
      donor: {
        _id: user._id,
        name: user.name,
        bloodGroup: user.bloodGroup,
        phone: user.phone,
        email: user.email,
        role: user.role,
        latitude: user.latitude,
        longitude: user.longitude,
        address: user.address,
        city: user.city,
        state: user.state
      }
    });
  } catch (error) {
    console.error('Error converting user to donor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register as donor',
      error: error.message
    });
  }
});

// POST - Stop being a donor (stop willing to donate)
router.post('/stop-donating', requireUserOrDonor, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await Donor.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is currently a donor
    if (user.role !== 'donor' || !user.willingToDonate) {
      return res.status(400).json({
        success: false,
        message: 'You are not currently registered as a donor'
      });
    }

    // Change role back to user (keep bloodGroup and history)
    user.role = 'user';
    user.willingToDonate = false;

    await user.save();

    res.json({
      success: true,
      message: 'You have been deactivated as a donor. You can reactivate anytime from settings.'
    });
  } catch (error) {
    console.error('Error deactivating donor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate donor profile',
      error: error.message
    });
  }
});

// GET - Check donor status
router.get('/donor-status', requireUserOrDonor, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await Donor.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isDonor = user.role === 'donor' && user.willingToDonate;

    res.json({
      success: true,
      isDonor: isDonor,
      isActive: user.isActive,
      role: user.role,
      donor: isDonor ? {
        bloodGroup: user.bloodGroup,
        totalDonations: user.totalDonations,
        lastDonationDate: user.lastDonationDate,
        status: user.status
      } : null
    });
  } catch (error) {
    console.error('Error checking donor status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check donor status',
      error: error.message
    });
  }
});

module.exports = router;
