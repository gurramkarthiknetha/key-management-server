const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * Email validation
 */
const validateEmail = () => [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .custom((value) => {
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || 'vnrvjiet.in';
      if (!value.endsWith(`@${allowedDomain}`)) {
        throw new Error(`Email must be from ${allowedDomain} domain`);
      }
      return true;
    })
];

/**
 * OTP validation
 */
const validateOTP = () => [
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

/**
 * User registration validation
 */
const validateUserRegistration = () => [
  ...validateEmail(),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage('Name can only contain letters, spaces, dots, hyphens, and apostrophes'),
  body('employeeId')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Employee ID must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Employee ID can only contain letters, numbers, underscores, and hyphens'),
  body('role')
    .isIn(['faculty', 'hod', 'security', 'security_incharge', 'admin'])
    .withMessage('Invalid role specified'),
  body('department')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters')
];

/**
 * Login validation
 */
const validateLogin = () => [
  ...validateEmail(),
  ...validateOTP()
];

/**
 * OTP request validation
 */
const validateOTPRequest = () => [
  ...validateEmail(),
  body('purpose')
    .optional()
    .isIn(['login', 'registration', 'password_reset', 'email_verification'])
    .withMessage('Invalid OTP purpose')
];

/**
 * Password validation
 */
const validatePassword = () => [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
];

/**
 * Password reset validation
 */
const validatePasswordReset = () => [
  ...validateEmail(),
  ...validateOTP(),
  ...validatePassword()
];

/**
 * Profile update validation
 */
const validateProfileUpdate = () => [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage('Name can only contain letters, spaces, dots, hyphens, and apostrophes'),
  body('department')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department must be between 2 and 100 characters')
];

/**
 * Role update validation (admin only)
 */
const validateRoleUpdate = () => [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('role')
    .isIn(['faculty', 'hod', 'security', 'security_incharge', 'admin'])
    .withMessage('Invalid role specified')
];

/**
 * Pagination validation
 */
const validatePagination = () => [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

/**
 * Search validation
 */
const validateSearch = () => [
  body('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .escape() // Sanitize for XSS protection
];

/**
 * ID parameter validation
 */
const validateIdParam = (paramName = 'id') => [
  body(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`)
];

/**
 * Custom validation for checking if email exists
 */
const checkEmailExists = async (email) => {
  const User = require('../models/User');
  const user = await User.findByEmail(email);
  if (user) {
    throw new Error('Email already registered');
  }
  return true;
};

/**
 * Custom validation for checking if employee ID exists
 */
const checkEmployeeIdExists = async (employeeId) => {
  const User = require('../models/User');
  const user = await User.findByEmployeeId(employeeId);
  if (user) {
    throw new Error('Employee ID already registered');
  }
  return true;
};

/**
 * Registration validation with uniqueness checks
 */
const validateUniqueRegistration = () => [
  ...validateUserRegistration(),
  body('email').custom(checkEmailExists),
  body('employeeId').custom(checkEmployeeIdExists)
];

module.exports = {
  handleValidationErrors,
  validateEmail,
  validateOTP,
  validateUserRegistration,
  validateUniqueRegistration,
  validateLogin,
  validateOTPRequest,
  validatePassword,
  validatePasswordReset,
  validateProfileUpdate,
  validateRoleUpdate,
  validatePagination,
  validateSearch,
  validateIdParam
};
