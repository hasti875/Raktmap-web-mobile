const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // SMS / WhatsApp Gateway Configuration
  smsGatewayUrl: {
    type: String,
    default: process.env.NIRMAAN_GATEWAY_URL || process.env.WHATSAPP_API_URL || 'https://chat.cryptonixtechnology.in'
  },
  smsApiKey: {
    type: String,
    default: process.env.NIRMAAN_API_KEY || process.env.WHATSAPP_API_KEY || process.env.SMS_API_KEY || ''
  },
  smsAccountSid: {
    type: String,
    default: process.env.NIRMAAN_SESSION_ID || process.env.WHATSAPP_SESSION_ID || process.env.WHATSAPP_SENDER || ''
  },
  smsPhoneNumber: {
    type: String,
    default: process.env.WHATSAPP_PHONE_NUMBER || process.env.NIRMAAN_SESSION_ID || process.env.WHATSAPP_SESSION_ID || process.env.WHATSAPP_SENDER || ''
  },
  
  // SMS Templates
  smsTemplateHighPriority: {
    type: String,
    default: '🚨 URGENT: Blood donation needed at {hospital}. Your {bloodType} blood can save a life. Reply YES to confirm.'
  },
  smsTemplateNormalPriority: {
    type: String,
    default: 'Blood donation request from {hospital}. Your {bloodType} blood is needed. Can you help? Reply YES to confirm.'
  },
  
  // Email Configuration
  emailApiKey: {
    type: String,
    default: ''
  },
  
  // App Preferences
  brightness: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notifications: {
    type: Boolean,
    default: true
  },
  
  // Notification Settings
  notificationStartTime: {
    type: String,
    default: '07:00'
  },
  notificationEndTime: {
    type: String,
    default: '22:00'
  },
  emergencyOverride: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

settingsSchema.statics.updateSettings = async function(updateData, adminId = null) {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(updateData);
  } else {
    Object.assign(settings, updateData);
    settings.lastUpdated = new Date();
    settings.updatedBy = adminId;
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);