const mongoose = require('mongoose');

// Extended schema to match fields used in the frontend (HospitalManagement component)
const HospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  phone: { type: String },
  emergencyContact: { type: String },
  address: { type: String },
  radius: { type: Number, default: 10 },
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'active', 'suspended', 'denied'], default: 'pending' },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Hospital', HospitalSchema);