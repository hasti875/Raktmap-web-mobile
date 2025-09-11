const express = require('express');
const router = express.Router();
const ResponseToken = require('../models/ResponseToken');
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const DonorLocationResponse = require('../models/DonorLocationResponse');

// GET route for token-based donor response
router.get('/r/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the token first without population
    const responseToken = await ResponseToken.findOne({ token, isUsed: false });
    
    if (!responseToken) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired response link'
      });
    }

    // Get request and donor details separately
    const request = await BloodRequest.findById(responseToken.requestId);
    const donor = await Donor.findById(responseToken.donorId);
    
    // Return token details for frontend
    res.json({
      success: true,
      data: {
        token: responseToken.token,
        request: request,
        donor: donor
      }
    });
    
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// POST route to submit donor location response
router.post('/r/:token/respond', async (req, res) => {
  try {
    const { token } = req.params;
    const { latitude, longitude, isAvailable, address } = req.body;
    
    // Find and validate token without population
    const responseToken = await ResponseToken.findOne({ token, isUsed: false });
    
    if (!responseToken) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired response link'
      });
    }
    
    // Create new donor location response
    const donorLocationResponse = new DonorLocationResponse({
      donorId: responseToken.donorId,
      requestId: responseToken.requestId,
      latitude,
      longitude,
      isAvailable: isAvailable !== false, // Default to true if not specified
      address,
      token,
      responseTime: new Date()
    });
    
    await donorLocationResponse.save();
    
    // Mark token as used
    responseToken.isUsed = true;
    await responseToken.save();
    
    console.log(`✅ Location response saved for donor ${responseToken.donorId.name} at ${latitude}, ${longitude}`);
    
    res.json({
      success: true,
      message: 'Response recorded successfully',
      data: {
        donorId: responseToken.donorId._id,
        requestId: responseToken.requestId._id,
        latitude,
        longitude,
        isAvailable,
        address,
        responseTime: donorLocationResponse.responseTime
      }
    });
    
  } catch (error) {
    console.error('Error recording response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record response'
    });
  }
});

module.exports = router;
