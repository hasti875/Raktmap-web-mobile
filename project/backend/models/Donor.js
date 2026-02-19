const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  rollNo: {
    type: String,
    trim: true
  },
  uniqueId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness
    trim: true,
    uppercase: true
  },
  bloodGroup: {
    type: String,
    required: false,  // Optional for users, required when role='donor'
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'NK'],
    uppercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'donor']  // 'user' = not willing to donate, 'donor' = willing to donate
  },
  willingToDonate: {
    type: Boolean,
    default: false  // false = user role, true = donor role
  },
  lastDonationDate: {
    type: Date
  },
  password: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true  // Main flag for soft delete/deactivation
  },
  isProfileComplete: {
    type: Boolean,
    default: false  // Track if donor completed profile setup
  },
  totalDonations: {
    type: Number,
    default: 0
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  birthdate: {
    type: Date,
    required: false
  },
  hasTattoo: {
    type: Boolean,
    default: false
  },
  isHIVPositive: {
    type: Boolean,
    default: false
  },
  latitude: {
    type: Number,
    required: false  // Required when becoming donor
  },
  longitude: {
    type: Number,
    required: false  // Required when becoming donor
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

const Donor = mongoose.model('Donor', donorSchema);

module.exports = Donor;