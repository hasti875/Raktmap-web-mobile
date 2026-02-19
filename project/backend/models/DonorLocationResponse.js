const mongoose = require('mongoose');

const donorResponseSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  address: {
    type: String
  },
  responseTime: {
    type: Date,
    default: Date.now
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // Auto-delete after 7 days (604800 seconds)
  }
}, {
  timestamps: true
});

// TTL Index - Auto-delete location responses after 7 days
donorResponseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('DonorResponse', donorResponseSchema);
