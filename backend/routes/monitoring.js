/*
 * monitoring.js (routes)
 * 
 * API endpoints ל-Real-Time Monitoring:
 * - GET /api/monitoring/:accountId - Full monitoring data
 * - GET /api/monitoring/:accountId/threats - Active threats
 * - GET /api/monitoring/:accountId/live - Live statistics
 * - GET /api/monitoring/:accountId/timeline - Threat timeline
 * - GET /api/monitoring/:accountId/attack - Attack detection
 */

const express = require('express');
const router = express.Router();
const monitoringService = require('../services/MonitoringService');
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
 * GET /api/monitoring/:accountId
 * Get full monitoring data
 */
router.get('/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { minutes = 60, includeHistory = 'true' } = req.query;

    // Verify account
    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const monitoring = await monitoringService.getMonitoringData(accountId, {
      minutes: parseInt(minutes),
      includeHistory: includeHistory === 'true'
    });

    res.json({
      success: true,
      monitoring,
      accountId
    });
  } catch (error) {
    console.error('Error getting monitoring data:', error);
    res.status(500).json({ error: 'Failed to get monitoring data' });
  }
});

/**
 * GET /api/monitoring/:accountId/threats
 * Get active threats only
 */
router.get('/:accountId/threats', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { minutes = 60 } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const threats = await monitoringService.getActiveThreats(
      accountId,
      parseInt(minutes)
    );

    res.json({
      success: true,
      threats,
      accountId
    });
  } catch (error) {
    console.error('Error getting threats:', error);
    res.status(500).json({ error: 'Failed to get threats' });
  }
});

/**
 * GET /api/monitoring/:accountId/live
 * Get live statistics
 */
router.get('/:accountId/live', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { minutes = 60 } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const liveStats = await monitoringService.getLiveStatistics(
      accountId,
      parseInt(minutes)
    );

    res.json({
      success: true,
      liveStats,
      accountId
    });
  } catch (error) {
    console.error('Error getting live stats:', error);
    res.status(500).json({ error: 'Failed to get live statistics' });
  }
});

/**
 * GET /api/monitoring/:accountId/timeline
 * Get threat timeline
 */
router.get('/:accountId/timeline', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { hours = 24 } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const timeline = await monitoringService.getThreatTimeline(
      accountId,
      parseInt(hours)
    );

    res.json({
      success: true,
      timeline,
      accountId
    });
  } catch (error) {
    console.error('Error getting timeline:', error);
    res.status(500).json({ error: 'Failed to get timeline' });
  }
});

/**
 * GET /api/monitoring/:accountId/attack
 * Detect if there's an active attack
 */
router.get('/:accountId/attack', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const attack = await monitoringService.detectActiveAttack(accountId);

    res.json({
      success: true,
      attack,
      accountId
    });
  } catch (error) {
    console.error('Error detecting attack:', error);
    res.status(500).json({ error: 'Failed to detect attack' });
  }
});

module.exports = router;