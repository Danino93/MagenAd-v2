/*
 * SecurityService.js - אבטחה והגנות
 * 
 * הגנות:
 * - SQL Injection Prevention
 * - XSS (Cross-Site Scripting) Protection
 * - CSRF (Cross-Site Request Forgery) Protection
 * - Rate Limiting
 * - Input Validation
 * - Authentication Security
 * - Data Encryption
 * - Security Headers
 */

const crypto = require('crypto');
const validator = require('validator');

class SecurityService {
  constructor() {
    // הגדרות Rate Limiting
    this.rateLimits = new Map();
    
    // רשימת IP חסומים
    this.blockedIPs = new Set();
    
    // ניסיונות התחברות כושלים
    this.failedAttempts = new Map();
  }

  /**
   * אימות והגנה על input
   */
  validateAndSanitize(input, type) {
    switch (type) {
      case 'email':
        return this.validateEmail(input);
      case 'url':
        return this.validateURL(input);
      case 'ip':
        return this.validateIP(input);
      case 'text':
        return this.sanitizeText(input);
      case 'html':
        return this.sanitizeHTML(input);
      case 'sql':
        return this.preventSQLInjection(input);
      default:
        return this.sanitizeGeneric(input);
    }
  }

  /**
   * אימות email
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email format');
    }

    // ניקוי whitespace
    email = email.trim().toLowerCase();

    // אימות format
    if (!validator.isEmail(email)) {
      throw new Error('Invalid email format');
    }

    // בדיקת אורך
    if (email.length > 255) {
      throw new Error('Email too long');
    }

    return email;
  }

  /**
   * אימות URL
   */
  validateURL(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL format');
    }

    // אימות שזה URL תקין
    if (!validator.isURL(url, { 
      protocols: ['http', 'https'],
      require_protocol: true 
    })) {
      throw new Error('Invalid URL format');
    }

    // בדיקת blacklist
    const blacklistedDomains = ['malicious.com', 'phishing.net'];
    const urlObj = new URL(url);
    
    if (blacklistedDomains.includes(urlObj.hostname)) {
      throw new Error('URL is blacklisted');
    }

    return url;
  }

  /**
   * אימות IP
   */
  validateIP(ip) {
    if (!ip || typeof ip !== 'string') {
      throw new Error('Invalid IP format');
    }

    if (!validator.isIP(ip)) {
      throw new Error('Invalid IP format');
    }

    // בדיקה אם IP חסום
    if (this.blockedIPs.has(ip)) {
      throw new Error('IP is blocked');
    }

    return ip;
  }

  /**
   * ניקוי טקסט מ-XSS
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // הסרת תגי HTML
    text = text.replace(/<[^>]*>/g, '');

    // הסרת JavaScript
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // escape תווים מיוחדים
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return text;
  }

  /**
   * ניקוי HTML (מותר רק תגים בטוחים)
   */
  sanitizeHTML(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // תגים מותרים
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'];
    
    // הסרת תגים לא מותרים
    html = html.replace(/<([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
      return allowedTags.includes(tag.toLowerCase()) ? match : '';
    });

    // הסרת JavaScript
    html = html.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    html = html.replace(/javascript:/gi, '');

    return html;
  }

  /**
   * הגנה מפני SQL Injection
   */
  preventSQLInjection(input) {
    if (!input || typeof input !== 'string') {
      return input;
    }

    // דפוסים חשודים
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(--|\;|\/\*|\*\/)/g,
      /(\bOR\b.*=.*)/gi,
      /(\bAND\b.*=.*)/gi,
      /('|"|\`)/g
    ];

    // בדיקה אם יש דפוס חשוד
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        throw new Error('Potential SQL injection detected');
      }
    }

    return input;
  }

  /**
   * Rate Limiting
   */
  checkRateLimit(identifier, limit = 100, window = 60000) {
    const now = Date.now();
    
    // קבלת או יצירת רשומה
    if (!this.rateLimits.has(identifier)) {
      this.rateLimits.set(identifier, {
        count: 0,
        resetTime: now + window
      });
    }

    const record = this.rateLimits.get(identifier);

    // איפוס אם חלון הזמן עבר
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + window;
    }

    // בדיקת limit
    if (record.count >= limit) {
      const remainingTime = Math.ceil((record.resetTime - now) / 1000);
      throw new Error(`Rate limit exceeded. Try again in ${remainingTime}s`);
    }

    record.count++;
    return true;
  }

  /**
   * CSRF Token Generation
   */
  generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * CSRF Token Validation
   */
  validateCSRFToken(token, sessionToken) {
    if (!token || !sessionToken) {
      return false;
    }

    // timing-safe comparison
    try {
      return crypto.timingSafeEqual(
        Buffer.from(token),
        Buffer.from(sessionToken)
      );
    } catch {
      return false;
    }
  }

  /**
   * Password Hashing (bcrypt simulation)
   */
  async hashPassword(password) {
    // וולידציה
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (password.length > 128) {
      throw new Error('Password too long');
    }

    // בדיקת חוזק סיסמה
    const strength = this.checkPasswordStrength(password);
    if (strength.score < 3) {
      throw new Error('Password too weak');
    }

    // כאן יהיה bcrypt אמיתי
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    
    return `${salt}:${hash}`;
  }

  /**
   * בדיקת חוזק סיסמה
   */
  checkPasswordStrength(password) {
    let score = 0;
    const feedback = [];

    // אורך
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // אותיות גדולות
    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Add uppercase letters');
    }

    // אותיות קטנות
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('Add lowercase letters');
    }

    // מספרים
    if (/[0-9]/.test(password)) {
      score++;
    } else {
      feedback.push('Add numbers');
    }

    // תווים מיוחדים
    if (/[^A-Za-z0-9]/.test(password)) {
      score++;
    } else {
      feedback.push('Add special characters');
    }

    return {
      score,
      strength: this.getStrengthLabel(score),
      feedback
    };
  }

  /**
   * תווית חוזק
   */
  getStrengthLabel(score) {
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  /**
   * Failed Login Attempts
   */
  recordFailedAttempt(identifier) {
    if (!this.failedAttempts.has(identifier)) {
      this.failedAttempts.set(identifier, {
        count: 0,
        lastAttempt: Date.now(),
        blockedUntil: null
      });
    }

    const record = this.failedAttempts.get(identifier);
    record.count++;
    record.lastAttempt = Date.now();

    // חסימה אחרי 5 ניסיונות
    if (record.count >= 5) {
      record.blockedUntil = Date.now() + (15 * 60 * 1000); // 15 דקות
      throw new Error('Account temporarily locked due to too many failed attempts');
    }
  }

  /**
   * בדיקה אם חשבון חסום
   */
  isAccountLocked(identifier) {
    if (!this.failedAttempts.has(identifier)) {
      return false;
    }

    const record = this.failedAttempts.get(identifier);
    
    if (record.blockedUntil && Date.now() < record.blockedUntil) {
      const remainingTime = Math.ceil((record.blockedUntil - Date.now()) / 1000 / 60);
      throw new Error(`Account locked. Try again in ${remainingTime} minutes`);
    }

    // איפוס אם החסימה פגה
    if (record.blockedUntil && Date.now() >= record.blockedUntil) {
      this.failedAttempts.delete(identifier);
      return false;
    }

    return false;
  }

  /**
   * Security Headers
   */
  getSecurityHeaders() {
    return {
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // XSS Protection
      'X-XSS-Protection': '1; mode=block',
      
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.anthropic.com"
      ].join('; '),
      
      // HSTS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions Policy
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  /**
   * Data Encryption (AES-256)
   */
  encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted
    };
  }

  /**
   * Data Decryption
   */
  decrypt(encryptedData, iv, key) {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(key),
      Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Secure Random Token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * IP Blocking
   */
  blockIP(ip, reason, duration = null) {
    this.blockedIPs.add(ip);
    
    console.log(`🚫 IP חסום: ${ip} (${reason})`);

    // חסימה זמנית
    if (duration) {
      setTimeout(() => {
        this.unblockIP(ip);
      }, duration);
    }
  }

  /**
   * IP Unblocking
   */
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    console.log(`✅ IP שוחרר: ${ip}`);
  }

  /**
   * Security Audit Log
   */
  async logSecurityEvent(event) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity || 'medium',
      details: event.details,
      ip: event.ip,
      user: event.user
    };

    console.log('🔒 Security Event:', logEntry);

    // שמירה למסד נתונים
    // await supabase.from('security_logs').insert(logEntry);
  }

  /**
   * בדיקת אבטחה מקיפה
   */
  async runSecurityAudit() {
    console.log('🔒 מריץ בדיקת אבטחה...\n');

    const results = {
      vulnerabilities: [],
      warnings: [],
      passed: []
    };

    // 1. בדיקת SQL Injection
    try {
      this.preventSQLInjection("' OR '1'='1");
      results.vulnerabilities.push('SQL Injection: VULNERABLE');
    } catch {
      results.passed.push('SQL Injection: PROTECTED');
    }

    // 2. בדיקת XSS
    const xssTest = this.sanitizeText('<script>alert("XSS")</script>');
    if (xssTest.includes('<script>')) {
      results.vulnerabilities.push('XSS: VULNERABLE');
    } else {
      results.passed.push('XSS: PROTECTED');
    }

    // 3. בדיקת Rate Limiting
    try {
      for (let i = 0; i < 105; i++) {
        this.checkRateLimit('test', 100, 60000);
      }
      results.vulnerabilities.push('Rate Limiting: NOT WORKING');
    } catch {
      results.passed.push('Rate Limiting: WORKING');
    }

    // 4. בדיקת Password Strength
    const weakPass = this.checkPasswordStrength('123456');
    if (weakPass.score < 3) {
      results.passed.push('Password Policy: ENFORCED');
    } else {
      results.warnings.push('Password Policy: TOO LENIENT');
    }

    // הדפסת תוצאות
    console.log('✅ Passed:', results.passed.length);
    results.passed.forEach(p => console.log(`  ✓ ${p}`));

    if (results.warnings.length > 0) {
      console.log('\n⚠️ Warnings:', results.warnings.length);
      results.warnings.forEach(w => console.log(`  ! ${w}`));
    }

    if (results.vulnerabilities.length > 0) {
      console.log('\n❌ Vulnerabilities:', results.vulnerabilities.length);
      results.vulnerabilities.forEach(v => console.log(`  ✗ ${v}`));
    }

    console.log('');
    return results;
  }
}

module.exports = new SecurityService();