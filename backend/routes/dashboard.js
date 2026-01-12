/*
 * dashboard.js (routes)
 * 
 * API endpoints ל-Dashboard:
 * - GET /api/dashboard/stats - Dashboard statistics
 * - GET /api/dashboard/recent-anomalies - Recent anomalies
 * - GET /api/dashboard/chart - Chart data
 */

const express = require('express');
const router = express.Router();
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
 * GET /api/dashboard/stats
 * Get dashboard statistics for the user
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    // Get user's active ad accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (accountsError) {
      throw accountsError;
    }

    if (!accounts || accounts.length === 0) {
      // No accounts - return empty stats
      return res.json({
        total_campaigns: 0,
        total_anomalies: 0,
        high_severity: 0,
        resolved_anomalies: 0,
        total_clicks: 0,
        total_cost: 0
      });
    }

    const accountIds = accounts.map(a => a.id);

    // Try to use the optimized function if it exists
    try {
      const { data: stats, error: statsError } = await supabase
        .rpc('get_dashboard_stats', { p_user_id: userId });

      if (!statsError && stats) {
        return res.json({
          total_campaigns: stats[0]?.total_campaigns || 0,
          total_anomalies: stats[0]?.total_anomalies || 0,
          high_severity: stats[0]?.high_severity || 0,
          resolved_anomalies: stats[0]?.resolved_anomalies || 0,
          total_clicks: stats[0]?.total_clicks || 0,
          total_cost: stats[0]?.total_cost || 0
        });
      }
    } catch (rpcError) {
      // RPC function might not exist - fall back to manual queries
      console.log('RPC function not available, using manual queries');
    }

    // Fallback: Manual queries
    // Count campaigns (active ad accounts)
    const totalCampaigns = accounts.length;

    // Count detections
    const { count: totalAnomalies, error: anomaliesError } = await supabase
      .from('detections')
      .select('*', { count: 'exact', head: true })
      .in('ad_account_id', accountIds);

    // Count high severity
    const { count: highSeverity, error: highError } = await supabase
      .from('detections')
      .select('*', { count: 'exact', head: true })
      .in('ad_account_id', accountIds)
      .eq('severity', 'high');

    // Count resolved (where action_taken is not null)
    const { count: resolvedAnomalies, error: resolvedError } = await supabase
      .from('detections')
      .select('*', { count: 'exact', head: true })
      .in('ad_account_id', accountIds)
      .not('action_taken', 'is', null);

    // Count total clicks
    const { count: totalClicks, error: clicksError } = await supabase
      .from('raw_events')
      .select('*', { count: 'exact', head: true })
      .in('ad_account_id', accountIds);

    // Sum total cost
    const { data: clicksWithCost, error: costError } = await supabase
      .from('raw_events')
      .select('cost_micros')
      .in('ad_account_id', accountIds)
      .not('cost_micros', 'is', null)
      .limit(10000); // Limit for performance

    let totalCost = 0;
    if (clicksWithCost) {
      totalCost = clicksWithCost.reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000; // Convert from micros
    }

    res.json({
      total_campaigns: totalCampaigns || 0,
      total_anomalies: totalAnomalies || 0,
      high_severity: highSeverity || 0,
      resolved_anomalies: resolvedAnomalies || 0,
      total_clicks: totalClicks || 0,
      total_cost: totalCost || 0
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

/**
 * GET /api/dashboard/recent-anomalies
 * Get recent anomalies for the user
 */
router.get('/recent-anomalies', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const limit = parseInt(req.query.limit) || 10;

    // Get user's active ad accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (accountsError) {
      throw accountsError;
    }

    if (!accounts || accounts.length === 0) {
      return res.json([]);
    }

    const accountIds = accounts.map(a => a.id);

    // Get recent detections
    const { data: detections, error: detectionsError } = await supabase
      .from('detections')
      .select('*')
      .in('ad_account_id', accountIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (detectionsError) {
      throw detectionsError;
    }

    res.json(detections || []);
  } catch (error) {
    console.error('Error getting recent anomalies:', error);
    res.status(500).json({ error: 'Failed to get recent anomalies' });
  }
});

/**
 * GET /api/dashboard/chart
 * Get chart data for dashboard
 */
router.get('/chart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const days = parseInt(req.query.days) || 7;

    // Get user's active ad accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (accountsError) {
      throw accountsError;
    }

    if (!accounts || accounts.length === 0) {
      return res.json([]);
    }

    const accountIds = accounts.map(a => a.id);

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get clicks grouped by date
    const { data: clicks, error: clicksError } = await supabase
      .from('raw_events')
      .select('click_timestamp, cost_micros')
      .in('ad_account_id', accountIds)
      .gte('click_timestamp', startDate.toISOString());

    if (clicksError) {
      throw clicksError;
    }

    // Group by date
    const chartData = {};
    for (const click of clicks || []) {
      const date = new Date(click.click_timestamp).toISOString().split('T')[0];
      if (!chartData[date]) {
        chartData[date] = { date, clicks: 0, cost: 0 };
      }
      chartData[date].clicks++;
      chartData[date].cost += (click.cost_micros || 0) / 1000000;
    }

    // Convert to array and sort by date
    const result = Object.values(chartData).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    res.json(result);
  } catch (error) {
    console.error('Error getting chart data:', error);
    res.status(500).json({ error: 'Failed to get chart data' });
  }
});

module.exports = router;
