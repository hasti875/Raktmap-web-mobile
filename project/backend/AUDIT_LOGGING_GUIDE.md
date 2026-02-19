# Audit Logging Implementation Guide

## Overview
This guide demonstrates how to implement comprehensive audit logging throughout your backend application.

## Quick Start

### 1. Import the Audit Logger

```javascript
const { 
  logLogin, 
  logBloodRequestCreated,
  logHospitalApproval,
  logAudit 
} = require('./utils/auditLogger');
```

### 2. Basic Usage Examples

#### Example 1: Login Success/Failure

```javascript
// In server.js - Login endpoint
app.post('/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user...
    const user = await Admin.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Log failed login attempt
      await logLogin({ email }, req, false, 'User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log failed login attempt
      await logLogin({ email: user.email }, req, false, 'Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token...
    const token = jwt.sign({ id: user._id, email: user.email, role: 'admin', name: user.name }, SECRET, { expiresIn: '7d' });
    
    // Log successful login
    await logLogin({ id: user._id, email: user.email, role: 'admin', name: user.name }, req, true);
    
    res.json({ success: true, token, role: 'admin', user: {...} });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});
```

#### Example 2: Blood Request Creation

```javascript
// In bloodRequestController.js - createBloodRequest function
const { logBloodRequestCreated } = require('../utils/auditLogger');

const createBloodRequest = async (req, res) => {
  try {
    const { bloodGroup, quantity, urgency, requiredBy, description } = req.body;
    const userFromToken = req.user;
    
    // Create blood request...
    const bloodRequest = new BloodRequest({
      hospitalId: hospital._id,
      bloodGroup,
      quantity,
      urgency,
      requiredBy,
      description
    });
    
    await bloodRequest.save();
    
    // Log audit trail
    await logBloodRequestCreated(userFromToken, req, bloodRequest);
    
    res.status(201).json({
      success: true,
      message: 'Blood request created',
      data: bloodRequest
    });
  } catch (error) {
    console.error('Error creating blood request:', error);
    res.status(500).json({ success: false, message: 'Failed to create blood request' });
  }
};
```

#### Example 3: Admin Hospital Approval

```javascript
// In server.js - Hospital approval endpoint
const { logHospitalApproval } = require('./utils/auditLogger');

app.post('/admin/hospitals/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    
    // Update hospital status
    hospital.isVerified = true;
    hospital.status = 'active';
    await hospital.save();
    
    // Log admin approval action
    await logHospitalApproval(req.user, req, hospital, true);
    
    res.json({ success: true, message: 'Hospital approved successfully', hospital });
  } catch (error) {
    console.error('Error approving hospital:', error);
    res.status(500).json({ success: false, message: 'Failed to approve hospital' });
  }
});
```

#### Example 4: SMS Batch Logging

```javascript
// In bloodRequestController.js - sendNextBatch function
const { logSMSBatchSent } = require('../utils/auditLogger');

const sendNextBatch = async (requestId) => {
  try {
    const request = await BloodRequest.findById(requestId).populate('hospitalId');
    const donors = await Donor.find({ _id: { $in: nextBatchIds } });
    
    let smsSuccessCount = 0;
    
    // Send SMS to donors...
    const smsPromises = donors.map(async (donor) => {
      const smsResult = await sendSMS(donorPhone, message);
      if (smsResult.success) smsSuccessCount++;
    });
    
    await Promise.allSettled(smsPromises);
    
    // Log SMS batch
    const hospital = request.hospitalId;
    await logSMSBatchSent(
      { id: hospital._id, email: hospital.email, role: 'hospital', name: hospital.name },
      null, // No req object in background job
      request._id,
      donors.length,
      smsSuccessCount
    );
    
    console.log(`✅ Batch complete. Sent: ${smsSuccessCount}/${donors.length}`);
  } catch (error) {
    console.error('Error in sendNextBatch:', error);
  }
};
```

#### Example 5: Custom Audit Log

```javascript
const { logAudit } = require('./utils/auditLogger');

// Custom audit log for password change
app.post('/change-password', authenticateToken, validatePasswordChange, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await Donor.findById(req.user.id);
    
    // Verify old password...
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    
    if (!isMatch) {
      // Log failed password change attempt
      await logAudit({
        action: 'PASSWORD_CHANGED',
        user: req.user,
        req,
        description: `Failed password change attempt for ${req.user.email}`,
        status: 'failure',
        errorMessage: 'Invalid old password',
        severity: 'medium',
        resourceType: 'Auth'
      });
      
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password...
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    
    // Log successful password change
    await logAudit({
      action: 'PASSWORD_CHANGED',
      user: req.user,
      req,
      description: `Password changed successfully for ${req.user.email}`,
      status: 'success',
      severity: 'high',
      resourceType: 'Auth'
    });
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});
```

#### Example 6: Unauthorized Access Logging

```javascript
const { logUnauthorizedAccess } = require('./utils/auditLogger');

// In middleware/security.js - requireAdmin function
const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    // Log unauthorized access attempt
    await logUnauthorizedAccess(req, 'Admin-only endpoint');
    
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};
```

#### Example 7: Data Export Logging

```javascript
const { logDataExported } = require('./utils/auditLogger');

// Admin: Export audit logs
router.get('/admin/audit-logs/export', requireAdmin, async (req, res) => {
  try {
    const auditLogs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(1000);
    
    // Generate CSV...
    const csv = generateCSV(auditLogs);
    
    // Log export action
    await logDataExported(req.user, req, 'Audit Logs CSV', auditLogs.length);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to export audit logs' });
  }
});
```

## Implementation Checklist

### Phase 1: Critical Actions (High Priority)
- [ ] Login/Logout (success and failure)
- [ ] Blood request creation
- [ ] SMS batch triggers
- [ ] Admin hospital approvals/denials
- [ ] Donation marking
- [ ] Password changes

### Phase 2: Admin Actions (Medium Priority)
- [ ] Hospital CRUD operations
- [ ] Donor CRUD operations
- [ ] Settings updates
- [ ] SMS configuration changes

### Phase 3: Security Events (High Priority)
- [ ] Unauthorized access attempts
- [ ] Rate limit exceeded events
- [ ] Failed authentication attempts (>3 consecutive)
- [ ] Suspicious activity patterns

### Phase 4: Data Operations (Medium Priority)
- [ ] Data exports (CSV, PDF)
- [ ] Bulk updates
- [ ] Database migrations

## Querying Audit Logs

### Get all audit logs for a user
```javascript
const AuditLog = require('./models/AuditLog');

const userAuditLogs = await AuditLog.find({ userEmail: 'admin@example.com' })
  .sort({ createdAt: -1 })
  .limit(50);
```

### Get all critical security events
```javascript
const criticalEvents = await AuditLog.find({ 
  severity: 'critical',
  createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
})
  .sort({ createdAt: -1 });
```

### Get all failed actions
```javascript
const failedActions = await AuditLog.find({ status: 'failure' })
  .sort({ createdAt: -1 })
  .limit(100);
```

### Get audit logs for a specific resource
```javascript
const bloodRequestLogs = await AuditLog.find({ 
  resourceType: 'BloodRequest',
  resourceId: bloodRequestId 
})
  .sort({ createdAt: -1 });
```

## API Endpoint for Audit Logs

### Create audit log viewer endpoint
```javascript
// GET /admin/audit-logs - Fetch audit logs with filtering
router.get('/admin/audit-logs', requireAdmin, async (req, res) => {
  try {
    const { 
      action, 
      userId, 
      severity, 
      status, 
      startDate, 
      endDate,
      limit = 50,
      page = 1
    } = req.query;
    
    // Build query
    const query = {};
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    const auditLogs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    const total = await AuditLog.countDocuments(query);
    
    res.json({
      success: true,
      data: auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});
```

## Best Practices

### 1. Always Log Before Response
```javascript
// ✅ Good - Log before sending response
await logHospitalApproval(req.user, req, hospital, true);
res.json({ success: true, message: 'Hospital approved' });

// ❌ Bad - Response sent before logging (if logging fails, response already sent)
res.json({ success: true, message: 'Hospital approved' });
await logHospitalApproval(req.user, req, hospital, true);
```

### 2. Include Meaningful Context
```javascript
// ✅ Good - Includes useful metadata
await logAudit({
  action: 'BLOOD_REQUEST_UPDATED',
  user: req.user,
  req,
  description: `Blood request status changed from ${oldStatus} to ${newStatus}`,
  resourceType: 'BloodRequest',
  resourceId: bloodRequest._id,
  metadata: {
    oldStatus,
    newStatus,
    bloodGroup: bloodRequest.bloodGroup,
    quantity: bloodRequest.quantity,
    urgency: bloodRequest.urgency
  }
});

// ❌ Bad - Minimal context
await logAudit({
  action: 'BLOOD_REQUEST_UPDATED',
  user: req.user,
  req,
  description: 'Updated blood request'
});
```

### 3. Log Both Success and Failure
```javascript
try {
  // Perform action...
  await hospital.save();
  
  // Log success
  await logHospitalCreated(req.user, req, hospital);
  
  res.json({ success: true, hospital });
} catch (error) {
  // Log failure
  await logAudit({
    action: 'HOSPITAL_CREATED',
    user: req.user,
    req,
    description: `Failed to create hospital: ${error.message}`,
    status: 'failure',
    errorMessage: error.message,
    severity: 'medium'
  });
  
  res.status(500).json({ success: false, message: 'Failed to create hospital' });
}
```

### 4. Use Appropriate Severity Levels
- **low**: Login success, logout, view operations
- **medium**: Create/update operations, SMS sends, regular admin actions
- **high**: Delete operations, approval/denial, password changes, security events
- **critical**: Bulk deletions, unauthorized access, system-wide changes

### 5. Don't Block on Audit Logging
```javascript
// Audit logging should never break the main flow
// The utility already handles this with try-catch
await logAudit({ ... }); // Safe - won't throw
```

## Migration Strategy

### Step 1: Keep Existing Notification Logging
- Don't remove existing notification creation
- Notifications are user-facing, audit logs are admin-facing
- They serve different purposes

### Step 2: Add Audit Logging Alongside
- Add audit logging calls next to existing notification code
- Both systems can coexist

### Step 3: Gradually Expand Coverage
- Start with critical actions (Phase 1)
- Add more actions over time (Phase 2-4)

### Step 4: Create Admin Dashboard
- Build UI to view/filter audit logs
- Add export functionality
- Implement real-time monitoring alerts

## Security Considerations

1. **Never log sensitive data**
   - Don't log passwords (even hashed)
   - Don't log full credit card numbers
   - Don't log API keys or tokens

2. **Rotate logs periodically**
   - Archive old logs to separate storage
   - Consider data retention policies

3. **Restrict access to audit logs**
   - Only admins should view audit logs
   - Super admin for security-related logs

4. **Monitor audit log tampering**
   - Audit logs should be append-only
   - Consider checksums/signatures for critical logs

## Troubleshooting

### Issue: Audit logs not appearing
**Solution**: Check that the user object has required fields (id, email, role, name)

### Issue: IP address showing as ::1 or undefined
**Solution**: Ensure reverse proxy headers are properly configured (x-forwarded-for)

### Issue: Performance degradation
**Solution**: Ensure indexes are created (run once):
```javascript
await AuditLog.createIndexes();
```

## Summary

This audit logging system provides:
- ✅ Permanent audit trail (no TTL)
- ✅ Admin attribution (who did what)
- ✅ IP address tracking
- ✅ Comprehensive metadata
- ✅ Flexible querying
- ✅ Easy integration
- ✅ Non-blocking operation

With this system, you can track every critical action in your application for compliance, security, and troubleshooting purposes.
