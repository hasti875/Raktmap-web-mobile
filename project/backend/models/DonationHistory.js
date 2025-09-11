const mongoose = require('mongoose');

const donationHistorySchema = new mongoose.Schema({
  donorId: {
    type: String,
    required: true,
    ref: 'Donor'
  },

  
  // Removed bloodRequestId and hospitalId fields
  donorName: {
    type: String,
    required: true
  },
  donorPhone: {
    type: String,
    required: true
  },
  donorBloodGroup: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['accepted', 'declined', 'pending', 'completed'],
    default: 'pending'
  },
  acceptedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  address: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

const DonationHistory = mongoose.model('DonationHistory', donationHistorySchema);

module.exports = DonationHistory;
