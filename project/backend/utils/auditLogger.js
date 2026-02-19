const AuditLog = require('../models/AuditLog');

/**
 * Helper function to create audit log entries
 * @param {Object} params - Audit log parameters
 * @param {String} params.action - Action type (e.g., 'BLOOD_REQUEST_CREATED')
 * @param {Object} params.user - User object from req.user { id, email, role, name }
 * @param {Object} params.req - Express request object (for IP and user agent)
 * @param {String} params.description - Human-readable description
 * @param {String} params.resourceType - Type of resource affected
 * @param {String} params.resourceId - ID of the resource
 * @param {Object} params.metadata - Additional context data
 * @param {String} params.status - 'success', 'failure', or 'warning'
 * @param {String} params.errorMessage - Error message if status is 'failure'
 * @param {String} params.severity - 'low', 'medium', 'high', or 'critical'
 */
async function logAudit({
  action,
  user,
  req = null,
  description,
  resourceType = null,
  resourceId = null,
  metadata = {},
  status = 'success',
  errorMessage = null,
  severity = 'medium'
}) {
  try {
    // Validate required fields
    if (!action || !user || !description) {
      console.error('❌ Audit log missing required fields:', { action, user: !!user, description: !!description });
      return null;
    }

    // Determine user model based on role
    let userModel = 'Donor'; // Default
    if (user.role === 'admin') userModel = 'Admin';
    else if (user.role === 'hospital') userModel = 'Hospital';

    // Extract IP and user agent from request
    const ipAddress = req ? (req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']) : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    // Create audit log entry
    const auditLog = new AuditLog({
      action,
      userId: user.id,
      userModel,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      ipAddress,
      userAgent,
      resourceType,
      resourceId,
      description,
      metadata,
      status,
      errorMessage,
      severity
    });

    await auditLog.save();
    
    // Also log to console with emoji indicators
    const statusEmoji = status === 'success' ? '✅' : status === 'failure' ? '❌' : '⚠️';
    const severityEmoji = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : 'ℹ️';
    
    console.log(`${statusEmoji} ${severityEmoji} [AUDIT] ${action} - ${user.email} - ${description}`);
    
    return auditLog;
  } catch (error) {
    console.error('❌ Failed to create audit log:', error.message);
    // Don't throw - audit logging should never break the main application flow
    return null;
  }
}

/**
 * Shorthand functions for common audit events
 */

// Authentication Events
async function logLogin(user, req, success = true, errorMessage = null) {
  return logAudit({
    action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
    user: success ? user : { id: 'unknown', email: user.email || 'unknown', role: 'unknown', name: 'Unknown' },
    req,
    description: success 
      ? `User ${user.email} logged in successfully`
      : `Failed login attempt for ${user.email}: ${errorMessage}`,
    status: success ? 'success' : 'failure',
    errorMessage,
    severity: success ? 'low' : 'medium',
    resourceType: 'Auth'
  });
}

async function logLogout(user, req) {
  return logAudit({
    action: 'LOGOUT',
    user,
    req,
    description: `User ${user.email} logged out`,
    severity: 'low',
    resourceType: 'Auth'
  });
}

// Blood Request Events
async function logBloodRequestCreated(user, req, bloodRequest) {
  return logAudit({
    action: 'BLOOD_REQUEST_CREATED',
    user,
    req,
    description: `Blood request created: ${bloodRequest.quantity} units of ${bloodRequest.bloodGroup}`,
    resourceType: 'BloodRequest',
    resourceId: bloodRequest._id,
    metadata: {
      bloodGroup: bloodRequest.bloodGroup,
      quantity: bloodRequest.quantity,
      urgency: bloodRequest.urgency,
      hospitalId: bloodRequest.hospitalId
    },
    severity: bloodRequest.urgency === 'high' || bloodRequest.urgency === 'pregnancy' ? 'high' : 'medium'
  });
}

async function logBloodRequestStatusChange(user, req, bloodRequest, oldStatus, newStatus) {
  return logAudit({
    action: 'BLOOD_REQUEST_UPDATED',
    user,
    req,
    description: `Blood request ${bloodRequest._id} status changed from ${oldStatus} to ${newStatus}`,
    resourceType: 'BloodRequest',
    resourceId: bloodRequest._id,
    metadata: {
      oldStatus,
      newStatus,
      bloodGroup: bloodRequest.bloodGroup,
      quantity: bloodRequest.quantity
    },
    severity: 'medium'
  });
}

// SMS Events
async function logSMSBatchSent(user, req, requestId, donorCount, successCount) {
  return logAudit({
    action: 'SMS_BATCH_SENT',
    user,
    req,
    description: `SMS batch sent: ${successCount}/${donorCount} delivered`,
    resourceType: 'SMS',
    resourceId: requestId,
    metadata: {
      totalDonors: donorCount,
      successfulSends: successCount,
      failedSends: donorCount - successCount
    },
    severity: 'medium'
  });
}

// Admin Actions
async function logHospitalApproval(admin, req, hospital, approved) {
  return logAudit({
    action: approved ? 'HOSPITAL_APPROVED' : 'HOSPITAL_DENIED',
    user: admin,
    req,
    description: approved 
      ? `Hospital "${hospital.name}" (${hospital.email}) approved by admin`
      : `Hospital "${hospital.name}" (${hospital.email}) denied by admin`,
    resourceType: 'Hospital',
    resourceId: hospital._id,
    metadata: {
      hospitalName: hospital.name,
      hospitalEmail: hospital.email,
      hospitalStatus: hospital.status
    },
    severity: 'high'
  });
}

async function logHospitalCreated(admin, req, hospital) {
  return logAudit({
    action: 'HOSPITAL_CREATED',
    user: admin,
    req,
    description: `Hospital "${hospital.name}" created by admin`,
    resourceType: 'Hospital',
    resourceId: hospital._id,
    metadata: {
      hospitalName: hospital.name,
      hospitalEmail: hospital.email
    },
    severity: 'medium'
  });
}

async function logDonorDeleted(admin, req, donorId, donorEmail) {
  return logAudit({
    action: 'DONOR_DELETED',
    user: admin,
    req,
    description: `Donor ${donorEmail} deleted by admin`,
    resourceType: 'Donor',
    resourceId: donorId,
    metadata: {
      donorEmail
    },
    severity: 'high'
  });
}

// Donation Events
async function logDonationMarked(user, req, donation) {
  return logAudit({
    action: 'DONATION_MARKED',
    user,
    req,
    description: `Donation marked: ${donation.donorName} (${donation.donorBloodGroup})`,
    resourceType: 'Donation',
    resourceId: donation._id,
    metadata: {
      donorName: donation.donorName,
      donorPhone: donation.donorPhone,
      bloodGroup: donation.donorBloodGroup,
      hospitalId: donation.hospitalId
    },
    severity: 'medium'
  });
}

// Security Events
async function logUnauthorizedAccess(req, attemptedResource) {
  return logAudit({
    action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    user: req.user || { id: 'unknown', email: 'unknown', role: 'unknown', name: 'Unknown' },
    req,
    description: `Unauthorized access attempt to ${attemptedResource}`,
    resourceType: 'System',
    metadata: {
      attemptedResource,
      url: req.originalUrl,
      method: req.method
    },
    status: 'failure',
    severity: 'high'
  });
}

async function logRateLimitExceeded(req, limit) {
  return logAudit({
    action: 'RATE_LIMIT_EXCEEDED',
    user: req.user || { id: 'unknown', email: 'unknown', role: 'unknown', name: 'Unknown' },
    req,
    description: `Rate limit exceeded: ${limit} requests`,
    resourceType: 'System',
    metadata: {
      limit,
      url: req.originalUrl,
      method: req.method
    },
    status: 'warning',
    severity: 'medium'
  });
}

// Settings Events
async function logSettingsUpdated(user, req, changedFields) {
  return logAudit({
    action: 'SETTINGS_UPDATED',
    user,
    req,
    description: `System settings updated: ${Object.keys(changedFields).join(', ')}`,
    resourceType: 'Settings',
    metadata: {
      changedFields
    },
    severity: 'high'
  });
}

// Data Export
async function logDataExported(user, req, exportType, recordCount) {
  return logAudit({
    action: 'DATA_EXPORTED',
    user,
    req,
    description: `Data exported: ${exportType} (${recordCount} records)`,
    resourceType: 'System',
    metadata: {
      exportType,
      recordCount
    },
    severity: 'medium'
  });
}

module.exports = {
  logAudit,
  logLogin,
  logLogout,
  logBloodRequestCreated,
  logBloodRequestStatusChange,
  logSMSBatchSent,
  logHospitalApproval,
  logHospitalCreated,
  logDonorDeleted,
  logDonationMarked,
  logUnauthorizedAccess,
  logRateLimitExceeded,
  logSettingsUpdated,
  logDataExported
};
