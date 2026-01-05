/*
 * detection.js (routes)
 * 
 * API endpoints לזיהוי הונאות:
 * - GET /api/detection/presets - רשימת רמות
 * - POST /api/detection/:accountId/analyze - ניתוח clicks
 * - GET /api/detection/:accountId/alerts - התראות
 * - GET /api/detection/:accountId/stats - סטטיסטיקות
 * - PUT /api/detection/:accountId/settings - עדכון רמה
 */
const express = require('express');
const router = express.Router();
const detectionEngine = require('../services/DetectionEngine');
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
 * GET /api/detection/presets
 * Get all detection presets
 */
router.get('/presets', authenticateToken, (req, res) => {
  try {
    const presets = detectionEngine.getAllPresets();
    res.json({ presets });
  } catch (error) {
    console.error('Error getting presets:', error);
    res.status(500).json({ error: 'Failed to get presets' });
  }
});

/**
 * POST /api/detection/:accountId/analyze
 * Analyze clicks and detect fraud
 */
router.post('/:accountId/analyze', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { preset = 'balanced', days = 7 } = req.body;

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

    // Get recent clicks
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: clicks, error: clicksError } = await supabase
      .from('raw_events')
      .select('*')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString())
      .order('event_timestamp', { ascending: false });

    if (clicksError) throw clicksError;

    // Analyze each click
    const results = [];
    const fraudDetections = [];

    for (const click of clicks || []) {
      const detection = await detectionEngine.detectFraud(click, accountId, preset);
      
      if (detection.isFraud) {
        // Save each detection to database
        for (const det of detection.detections) {
          const saved = await detectionEngine.saveDetection(det, click.id, accountId);
          fraudDetections.push(saved);
        }
      }

      results.push({
        clickId: click.id,
        ...detection
      });
    }

    res.json({
      success: true,
      analyzed: clicks?.length || 0,
      fraudulent: results.filter(r => r.isFraud).length,
      detections: fraudDetections,
      preset,
      summary: {
        total_clicks: clicks?.length || 0,
        fraud_clicks: results.filter(r => r.isFraud).length,
        average_fraud_score: results.reduce((sum, r) => sum + r.fraudScore, 0) / results.length || 0
      }
    });
  } catch (error) {
    console.error('Error analyzing clicks:', error);
    res.status(500).json({ error: 'Failed to analyze clicks' });
  }
});

/**
 * GET /api/detection/:accountId/alerts
 * Get fraud alerts for an account
 */
router.get('/:accountId/alerts', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 7, severity, limit = 50 } = req.query;

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

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Build query
    let query = supabase
      .from('fraud_detections')
      .select(`
        *,
        raw_events:raw_event_id (
          gclid,
          campaign_id,
          device_type,
          country_code,
          city,
          cost_micros,
          event_timestamp
        )
      `)
      .eq('ad_account_id', accountId)
      .gte('detected_at', startDate.toISOString())
      .order('detected_at', { ascending: false })
      .limit(parseInt(limit));

    if (severity) {
      query = query.eq('severity_level', severity);
    }

    const { data: alerts, error } = await query;

    if (error) throw error;

    res.json({
      alerts: alerts || [],
      count: alerts?.length || 0,
      filters: { days, severity, limit }
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * GET /api/detection/:accountId/stats
 * Get fraud detection statistics
 */
router.get('/:accountId/stats', authenticateToken, async (req, res) => {
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

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get all detections
    const { data: detections, error: detectionsError } = await supabase
      .from('fraud_detections')
      .select('*')
      .eq('ad_account_id', accountId)
      .gte('detected_at', startDate.toISOString());

    if (detectionsError) throw detectionsError;

    // Get all clicks
    const { data: clicks, error: clicksError } = await supabase
      .from('raw_events')
      .select('*')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString());

    if (clicksError) throw clicksError;

    // Calculate stats
    const totalClicks = clicks?.length || 0;
    const totalDetections = detections?.length || 0;
    const uniqueFraudClicks = new Set(detections?.map(d => d.raw_event_id)).size;

    const bySeverity = {
      high: detections?.filter(d => d.severity_level === 'high').length || 0,
      medium: detections?.filter(d => d.severity_level === 'medium').length || 0,
      low: detections?.filter(d => d.severity_level === 'low').length || 0
    };

    const byType = {};
    (detections || []).forEach(d => {
      byType[d.detection_type] = (byType[d.detection_type] || 0) + 1;
    });

    // Calculate fraud rate
    const fraudRate = totalClicks > 0 ? (uniqueFraudClicks / totalClicks) * 100 : 0;

    // Calculate cost impact
    const fraudClickIds = new Set(detections?.map(d => d.raw_event_id));
    const fraudCost = (clicks || [])
      .filter(c => fraudClickIds.has(c.id))
      .reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000;

    const totalCost = (clicks || [])
      .reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000;

    res.json({
      stats: {
        total_clicks: totalClicks,
        total_detections: totalDetections,
        unique_fraud_clicks: uniqueFraudClicks,
        fraud_rate: fraudRate.toFixed(2),
        by_severity: bySeverity,
        by_type: byType,
        cost_impact: {
          fraud_cost: fraudCost.toFixed(2),
          total_cost: totalCost.toFixed(2),
          percentage: totalCost > 0 ? ((fraudCost / totalCost) * 100).toFixed(2) : 0
        }
      },
      days: parseInt(days)
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * PUT /api/detection/:accountId/settings
 * Update detection settings (preset level)
 */
router.put('/:accountId/settings', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { preset } = req.body;

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

    // Validate preset
    const validPresets = ['liberal', 'balanced', 'aggressive'];
    if (!validPresets.includes(preset)) {
      return res.status(400).json({ error: 'Invalid preset' });
    }

    // Update account settings
    const { data: updated, error: updateError } = await supabase
      .from('ad_accounts')
      .update({ 
        detection_preset: preset,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      preset,
      account: updated
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * DELETE /api/detection/:accountId/alerts/:alertId
 * Dismiss/delete an alert
 */
router.delete('/:accountId/alerts/:alertId', authenticateToken, async (req, res) => {
  try {
    const { accountId, alertId } = req.params;

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

    // Delete alert
    const { error: deleteError } = await supabase
      .from('fraud_detections')
      .delete()
      .eq('id', alertId)
      .eq('ad_account_id', accountId);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: 'Alert dismissed' });
  } catch (error) {
    console.error('Error dismissing alert:', error);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

module.exports = router;