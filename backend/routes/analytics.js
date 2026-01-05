/*
 * analytics.js (routes)
 * 
 * API endpoints ל-Advanced Analytics:
 * - GET /api/analytics/:accountId - All analytics
 * - GET /api/analytics/:accountId/geographic - Geographic only
 * - GET /api/analytics/:accountId/isp - ISP breakdown
 * - GET /api/analytics/:accountId/risk - Risk distribution
 * - GET /api/analytics/:accountId/vpn - VPN/Hosting stats
 * - GET /api/analytics/:accountId/timeseries - Time series data
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/AnalyticsService');
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
 * GET /api/analytics/:accountId
 * Get comprehensive analytics
 */
router.get('/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 7 } = req.query;

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

    // Get analytics
    const analytics = await analyticsService.getAnalytics(accountId, {
      days: parseInt(days)
    });

    res.json({
      success: true,
      analytics,
      accountId,
      days: parseInt(days)
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * GET /api/analytics/:accountId/geographic
 * Get geographic analytics only
 */
router.get('/:accountId/geographic', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 7 } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const geographic = await analyticsService.getGeographicAnalytics(
      accountId,
      parseInt(days)
    );

    res.json({
      success: true,
      geographic,
      accountId
    });
  } catch (error) {
    console.error('Error getting geographic analytics:', error);
    res.status(500).json({ error: 'Failed to get geographic analytics' });
  }
});

/**
 * GET /api/analytics/:accountId/isp
 * Get ISP breakdown
 */
router.get('/:accountId/isp', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 7 } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const ispBreakdown = await analyticsService.getISPBreakdown(
      accountId,
      parseInt(days)
    );

    res.json({
      success: true,
      ispBreakdown,
      accountId
    });
  } catch (error) {
    console.error('Error getting ISP breakdown:', error);
    res.status(500).json({ error: 'Failed to get ISP breakdown' });
  }
});

/**
 * GET /api/analytics/:accountId/risk
 * Get risk distribution
 */
router.get('/:accountId/risk', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 7 } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const riskDistribution = await analyticsService.getRiskDistribution(
      accountId,
      parseInt(days)
    );

    res.json({
      success: true,
      riskDistribution,
      accountId
    });
  } catch (error) {
    console.error('Error getting risk distribution:', error);
    res.status(500).json({ error: 'Failed to get risk distribution' });
  }
});

/**
 * GET /api/analytics/:accountId/vpn
 * Get VPN/Hosting statistics
 */
router.get('/:accountId/vpn', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 7 } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const vpnStats = await analyticsService.getVPNStats(
      accountId,
      parseInt(days)
    );

    res.json({
      success: true,
      vpnStats,
      accountId
    });
  } catch (error) {
    console.error('Error getting VPN stats:', error);
    res.status(500).json({ error: 'Failed to get VPN stats' });
  }
});

/**
 * GET /api/analytics/:accountId/timeseries
 * Get time series data
 */
router.get('/:accountId/timeseries', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 7 } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const timeSeries = await analyticsService.getTimeSeries(
      accountId,
      parseInt(days)
    );

    res.json({
      success: true,
      timeSeries,
      accountId
    });
  } catch (error) {
    console.error('Error getting time series:', error);
    res.status(500).json({ error: 'Failed to get time series' });
  }
});

module.exports = router;