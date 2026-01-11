/*
 * anomalies.js (routes)
 * 
 * Routes לפעולות מרוכזות על אנומליות - MagenAd V2
 * 
 * תפקיד:
 * - ניהול פעולות מרוכזות על אנומליות (bulk operations)
 * - פתרון, ביטול, מחיקה, שליחה לחקירה של מספר אנומליות בו-זמנית
 * 
 * Endpoints:
 * - POST /api/anomalies/bulk-resolve - פתרון מרוכז
 * - POST /api/anomalies/bulk-dismiss - ביטול מרוכז
 * - POST /api/anomalies/bulk-delete - מחיקה מרוכזת
 * - POST /api/anomalies/bulk-investigate - שליחה לחקירה מרוכזת
 * 
 * Authentication:
 * - כל ה-endpoints דורשים JWT token
 * - Middleware: authenticateToken
 * 
 * Request Body:
 * - ids: מערך IDs של אנומליות (required)
 * - accountId: ID של חשבון (optional, אם לא מוגדר - כל החשבונות של המשתמש)
 * 
 * Response:
 * - success: boolean
 * - message: הודעת הצלחה
 * - count: מספר פריטים שעודכנו
 * - ids: מערך IDs שעודכנו
 */

const express = require('express');
const router = express.Router();
const anomalyController = require('../controllers/anomalyController');
const jwt = require('jsonwebtoken');

/**
 * Middleware: Verify JWT token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('❌ JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    // Make sure we have the user ID
    req.user = {
      id: decoded.userId || decoded.id || decoded.user_id,
      userId: decoded.userId || decoded.id || decoded.user_id,
      email: decoded.email
    };
    
    if (!req.user.id) {
      console.error('❌ No user ID in token:', decoded);
      return res.status(403).json({ error: 'Invalid token: missing user ID' });
    }
    
    next();
  });
};

/**
 * Bulk Operations
 */
router.post('/bulk-resolve', authenticateToken, anomalyController.bulkResolve);
router.post('/bulk-dismiss', authenticateToken, anomalyController.bulkDismiss);
router.post('/bulk-delete', authenticateToken, anomalyController.bulkDelete);
router.post('/bulk-investigate', authenticateToken, anomalyController.bulkInvestigate);

module.exports = router;
