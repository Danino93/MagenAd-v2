/*
 * alerts.js (routes)
 * 
 * Alert Management API:
 * - GET /api/alerts/:accountId - Get all alerts
 * - POST /api/alerts/:accountId - Create alert
 * - PUT /api/alerts/:accountId/:alertId/resolve - Resolve alert
 * - PUT /api/alerts/:accountId/:alertId/dismiss - Dismiss alert
 * - GET /api/alerts/:accountId/rules - Get alert rules
 * - POST /api/alerts/:accountId/rules - Create alert rule
 * - PUT /api/alerts/:accountId/rules/:ruleId - Update alert rule
 * - DELETE /api/alerts/:accountId/rules/:ruleId - Delete alert rule
 * - POST /api/alerts/:accountId/evaluate - Evaluate rules manually
 */

const express = require('express');
const router = express.Router();
const alertService = require('../services/AlertService');
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Get alerts
router.get('/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { status, severity, limit } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const alerts = await alertService.getAlerts(accountId, {
      status,
      severity,
      limit: limit ? parseInt(limit) : 50
    });

    res.json({ success: true, alerts, accountId });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Create alert
router.post('/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const alertData = req.body;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const alert = await alertService.createAlert(accountId, alertData);

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Resolve alert
router.put('/:accountId/:alertId/resolve', authenticateToken, async (req, res) => {
  try {
    const { accountId, alertId } = req.params;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const alert = await alertService.resolveAlert(alertId, req.user.email);

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Dismiss alert
router.put('/:accountId/:alertId/dismiss', authenticateToken, async (req, res) => {
  try {
    const { accountId, alertId } = req.params;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const alert = await alertService.dismissAlert(alertId, req.user.email);

    res.json({ success: true, alert });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

// Evaluate alert rules
router.post('/:accountId/evaluate', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const alerts = await alertService.evaluateAlertRules(accountId);

    res.json({ success: true, alertsTriggered: alerts.length, alerts });
  } catch (error) {
    console.error('Error evaluating rules:', error);
    res.status(500).json({ error: 'Failed to evaluate rules' });
  }
});

module.exports = router;