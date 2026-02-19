const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', index: true },
  type: { type: String, enum: ['info','success','warning','error'], default: 'info' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  meta: { type: Object },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
  bloodRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } });

notificationSchema.index({ hospitalId: 1, read: 1, createdAt: -1 });

// TTL Index - Auto-delete notifications after 30 days to prevent database bloat
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', notificationSchema);
