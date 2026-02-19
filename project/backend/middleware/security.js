// Security Middleware and Validators for RaktMap
// Reusable validation and security helpers

const { body, param, validationResult } = require('express-validator');

// ==================== VALIDATION MIDDLEWARE ====================

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Validate location coordinates
const validateLocation = [
  body('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude (must be between -90 and 90)'),
  body('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude (must be between -180 and 180)'),
  body('requestId')
    .optional()
    .isMongoId()
    .withMessage('Invalid request ID format'),
  handleValidationErrors
];

// Validate phone number (international format)
const validatePhoneNumber = [
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  handleValidationErrors
];

// Validate email
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  handleValidationErrors
];

// Validate blood group
const validateBloodGroup = [
  body('bloodGroup')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
  handleValidationErrors
];

// Validate registration data
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number'),
  handleValidationErrors
];

// Validate login data
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Validate blood request
const validateBloodRequest = [
  body('bloodType')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood type'),
  body('urgency')
    .isIn(['critical', 'urgent', 'normal'])
    .withMessage('Invalid urgency level'),
  body('unitsNeeded')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Units needed must be between 1 and 50'),
  handleValidationErrors
];

// Validate MongoDB ObjectId
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Validate blood stock update
const validateBloodStock = [
  body('bloodGroup')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
  body('unitsAvailable')
    .isInt({ min: 0, max: 1000 })
    .withMessage('Units must be between 0 and 1000'),
  handleValidationErrors
];

// Validate OTP
const validateOTP = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
  handleValidationErrors
];

// Validate password reset OTP
const validateResetOTP = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
  handleValidationErrors
];

// Validate password change
const validatePasswordChange = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
  handleValidationErrors
];

// Validate forgot password request
const validateForgotPassword = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  handleValidationErrors
];

// Validate password reset
const validatePasswordReset = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  handleValidationErrors
];

// ==================== SECURITY HELPERS ====================

// Sanitize user input to prevent XSS in database
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  return input;
};

// Check if request is from authenticated admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check if request is from authenticated hospital
const requireHospital = (req, res, next) => {
  if (!req.user || req.user.role !== 'hospital') {
    return res.status(403).json({
      success: false,
      message: 'Hospital access required'
    });
  }
  next();
};

// Check if request is from authenticated donor
const requireDonor = (req, res, next) => {
  if (!req.user || req.user.role !== 'donor') {
    return res.status(403).json({
      success: false,
      message: 'Donor access required'
    });
  }
  next();
};

// Check if request is from authenticated user (not donor yet)
const requireUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({
      success: false,
      message: 'User access required'
    });
  }
  next();
};

// Allow both user and donor roles (for profile management)
const requireUserOrDonor = (req, res, next) => {
  if (!req.user || (req.user.role !== 'user' && req.user.role !== 'donor')) {
    return res.status(403).json({
      success: false,
      message: 'User or donor access required'
    });
  }
  next();
};

// ==================== EXPORTS ====================

module.exports = {
  // Validation middleware
  validateLocation,
  validatePhoneNumber,
  validateEmail,
  validateBloodGroup,
  validateRegistration,
  validateLogin,
  validateBloodRequest,
  validateMongoId,
  validateBloodStock,
  validateOTP,
  validateResetOTP,
  validatePasswordChange,
  validateForgotPassword,
  validatePasswordReset,
  handleValidationErrors,
  
  // Security helpers
  sanitizeInput,
  requireAdmin,
  requireHospital,
  requireDonor,
  requireUser,
  requireUserOrDonor
};
