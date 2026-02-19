const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Action Details
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGOUT',
      'PASSWORD_CHANGED',
      'PASSWORD_RESET',
      
      // Blood Requests
      'BLOOD_REQUEST_CREATED',
      'BLOOD_REQUEST_UPDATED',
      'BLOOD_REQUEST_DELETED',
      'BLOOD_REQUEST_FULFILLED',
      'BLOOD_REQUEST_CANCELLED',
      
      // SMS Operations
      'SMS_BATCH_SENT',
      'SMS_SENT',
      'SMS_FAILED',
      
      // Admin Actions
      'HOSPITAL_APPROVED',
      'HOSPITAL_DENIED',
      'HOSPITAL_SUSPENDED',
      'HOSPITAL_CREATED',
      'HOSPITAL_UPDATED',
      'HOSPITAL_DELETED',
      'DONOR_CREATED',
      'DONOR_UPDATED',
      'DONOR_DELETED',
      
      // Donations
      'DONATION_MARKED',
      'DONATION_VERIFIED',
      
      // Settings
      'SETTINGS_UPDATED',
      'SMS_CONFIG_UPDATED',
      
      // Security
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'RATE_LIMIT_EXCEEDED',
      
      // Data Operations
      'DATA_EXPORTED',
      'BULK_UPDATE'
    ]
  },
  
  // User who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    required: true,
    enum: ['Admin', 'Hospital', 'Donor']
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String
  },
  userRole: {
    type: String,
    required: true,
    enum: ['admin', 'hospital', 'donor', 'user']
  },
  
  // Action Context
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  
  // Resource Details
  resourceType: {
    type: String,
    enum: ['BloodRequest', 'Hospital', 'Donor', 'SMS', 'Donation', 'Settings', 'Auth', 'System']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // Details
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Store additional context
    default: {}
  },
  
  // Result
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success'
  },
  errorMessage: {
    type: String
  },
  
  // Severity Level
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
  
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for query performance
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ userEmail: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 }); // For chronological listing
auditLogSchema.index({ severity: 1, createdAt: -1 }); // For filtering critical events

// DO NOT add TTL index - audit logs should be permanent
// Keep logs for compliance and forensic analysis

module.exports = mongoose.model('AuditLog', auditLogSchema);
