const mongoose = require('mongoose');

const bloodStockSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    uppercase: true
  },
  unitsAvailable: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['available', 'low', 'critical', 'out_of_stock'],
    default: 'available'
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { 
  timestamps: true 
});

// Compound index to ensure one entry per hospital per blood group
bloodStockSchema.index({ hospitalId: 1, bloodGroup: 1 }, { unique: true });

// Method to automatically set status based on units
bloodStockSchema.pre('save', function(next) {
  if (this.unitsAvailable === 0) {
    this.status = 'out_of_stock';
  } else if (this.unitsAvailable <= 5) {
    this.status = 'critical';
  } else if (this.unitsAvailable <= 10) {
    this.status = 'low';
  } else {
    this.status = 'available';
  }
  this.lastUpdated = new Date();
  next();
});

// Static method to get all hospitals with available blood for a specific blood group
bloodStockSchema.statics.getHospitalsWithBlood = async function(bloodGroup) {
  return this.find({ 
    bloodGroup: bloodGroup,
    unitsAvailable: { $gt: 0 }
  }).populate('hospitalId', 'name address phone emergencyContact');
};

// Static method to get hospital's complete stock
bloodStockSchema.statics.getHospitalStock = async function(hospitalId) {
  return this.find({ hospitalId: hospitalId }).sort({ bloodGroup: 1 });
};

module.exports = mongoose.model('BloodStock', bloodStockSchema);
