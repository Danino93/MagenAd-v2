/*
 * quietindex.js (routes)
 * 
 * API endpoints ל-Quiet Index™:
 * - GET /api/qi/:accountId - Current QI
 * - POST /api/qi/:accountId/calculate - Recalculate QI
 * - GET /api/qi/:accountId/history - QI history
 * - GET /api/qi/:accountId/compare - Compare periods
 */

const express = require('express');
const router = express.Router();
const quietIndexService = require('../services/QuietIndexService');
const supabase = require('../config/supabase');
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

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

/**
 * GET /api/qi/:accountId
 * Get current Quiet Index for account
 */
router.get('/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get current QI (cached or calculated)
    const qi = await quietIndexService.getCurrentQI(accountId);

    res.json({
      success: true,
      qi,
      accountId
    });
  } catch (error) {
    console.error('Error getting QI:', error);
    res.status(500).json({ error: 'Failed to get Quiet Index' });
  }
});

/**
 * POST /api/qi/:accountId/calculate
 * Force recalculation of Quiet Index
 */
router.post('/:accountId/calculate', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 7, preset = 'balanced' } = req.body;

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Calculate QI
    const qi = await quietIndexService.calculateQI(accountId, {
      days: parseInt(days),
      preset,
      useCache: false
    });

    res.json({
      success: true,
      qi,
      accountId,
      message: 'Quiet Index מחושב בהצלחה'
    });
  } catch (error) {
    console.error('Error calculating QI:', error);
    res.status(500).json({ error: 'Failed to calculate Quiet Index' });
  }
});

/**
 * GET /api/qi/:accountId/history
 * Get QI history for account
 */
router.get('/:accountId/history', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 30 } = req.query;

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get history
    const history = await quietIndexService.getQIHistory(accountId, parseInt(days));

    res.json({
      success: true,
      history,
      count: history.length,
      accountId
    });
  } catch (error) {
    console.error('Error getting QI history:', error);
    res.status(500).json({ error: 'Failed to get QI history' });
  }
});

/**
 * GET /api/qi/:accountId/compare
 * Compare QI between periods
 */
router.get('/:accountId/compare', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period1 = 7, period2 = 14 } = req.query;

    // Verify account belongs to user
    const { data: account, error: accountError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Compare periods
    const comparison = await quietIndexService.compareQI(
      accountId,
      parseInt(period1),
      parseInt(period2)
    );

    res.json({
      success: true,
      comparison,
      accountId
    });
  } catch (error) {
    console.error('Error comparing QI:', error);
    res.status(500).json({ error: 'Failed to compare QI' });
  }
});

module.exports = router;