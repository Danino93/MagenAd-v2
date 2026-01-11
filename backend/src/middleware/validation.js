/*
 * Input Validation Middleware
 * ----------------------------
 * אימות וסניטציה של קלט משתמש
 */

const validator = require('validator')

// Sanitize string input
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return ''
  
  // Remove HTML tags
  str = validator.escape(str)
  
  // Remove extra whitespace
  str = str.trim()
  
  return str
}

// Validate email
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'אימייל לא תקין' }
  }
  
  if (!validator.isEmail(email)) {
    return { valid: false, message: 'פורמט אימייל לא תקין' }
  }
  
  return { valid: true }
}

// Validate password
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'סיסמה לא תקינה' }
  }
  
  // At least 8 characters
  if (password.length < 8) {
    return { valid: false, message: 'סיסמה חייבת להכיל לפחות 8 תווים' }
  }
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'סיסמה חייבת להכיל אות גדולה אחת לפחות' }
  }
  
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'סיסמה חייבת להכיל אות קטנה אחת לפחות' }
  }
  
  // At least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'סיסמה חייבת להכיל מספר אחד לפחות' }
  }
  
  // At least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'סיסמה חייבת להכיל תו מיוחד אחד לפחות' }
  }
  
  return { valid: true }
}

// Validate UUID
function validateUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, message: 'UUID לא תקין' }
  }
  
  if (!validator.isUUID(uuid)) {
    return { valid: false, message: 'פורמט UUID לא תקין' }
  }
  
  return { valid: true }
}

// SQL Injection prevention
function preventSQLInjection(input) {
  if (!input || typeof input !== 'string') return input
  
  // Check for common SQL injection patterns
  const sqlPatterns = [
    /(\bOR\b|\bAND\b).*=.*$/i,
    /UNION.*SELECT/i,
    /DROP.*TABLE/i,
    /INSERT.*INTO/i,
    /DELETE.*FROM/i,
    /--/,
    /;.*$/
  ]
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      throw new Error('Invalid input detected')
    }
  }
  
  return input
}

module.exports = {
  sanitizeString,
  validateEmail,
  validatePassword,
  validateUUID,
  preventSQLInjection
}
