const express = require('express');
const router = express.Router();
const clicksService = require('../services/ClicksService');
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

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('❌ JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    // Make sure we have the user ID
    req.user = {
      id: decoded.userId || decoded.id || decoded.user_id,
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
 * GET /api/clicks/:accountId
 * Get clicks for an account from database
 */
router.get('/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 7, campaignId, limit = 100, offset = 0 } = req.query;

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

    // Get clicks from database
    const clicks = await clicksService.getClicksFromDB(accountId, {
      days: parseInt(days),
      campaignId,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ 
      clicks,
      count: clicks.length,
      accountId,
      filters: { days, campaignId, limit, offset }
    });
  } catch (error) {
    console.error('Error fetching clicks:', error);
    res.status(500).json({ error: 'Failed to fetch clicks' });
  }
});

/**
 * POST /api/clicks/:accountId/sync
 * Sync clicks from Google Ads API to database
 */
router.post('/:accountId/sync', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { days = 7, campaignId } = req.body;

    // Get account with refresh token
    const { data: account, error: accountError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Sync clicks
    const clicks = await clicksService.syncClicks(
      accountId,
      account.customer_id,
      account.refresh_token,
      { days, campaignId }
    );

    res.json({
      success: true,
      synced: clicks.length,
      message: `Synced ${clicks.length} clicks from Google Ads`
    });
  } catch (error) {
    console.error('Error syncing clicks:', error);
    res.status(500).json({ error: 'Failed to sync clicks' });
  }
});

/**
 * GET /api/clicks/:accountId/stats
 * Get click statistics
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

    // Get stats
    const stats = await clicksService.getClickStats(accountId, parseInt(days));

    res.json({ 
      stats,
      accountId,
      days: parseInt(days)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/clicks/:accountId/recent
 * Get most recent clicks (for live feed)
 */
router.get('/:accountId/recent', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { limit = 20 } = req.query;

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
    const { data: clicks, error } = await supabase
      .from('raw_events')
      .select('*')
      .eq('ad_account_id', accountId)
      .order('click_timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    res.json({ 
      clicks: clicks || [],
      count: clicks?.length || 0
    });
  } catch (error) {
    console.error('Error fetching recent clicks:', error);
    res.status(500).json({ error: 'Failed to fetch recent clicks' });
  }
});

/**
 * GET /api/clicks/:accountId/campaigns
 * Get clicks grouped by campaign
 */
router.get('/:accountId/campaigns', authenticateToken, async (req, res) => {
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

    // Get clicks grouped by campaign
    const { data: clicks, error } = await supabase
      .from('raw_events')
      .select('campaign_id, cost_micros, click_timestamp')
      .eq('ad_account_id', accountId)
      .gte('click_timestamp', startDate.toISOString());

    if (error) throw error;

    // Group by campaign
    const campaigns = {};
    (clicks || []).forEach(click => {
      const campaignId = click.campaign_id || 'unknown';
      if (!campaigns[campaignId]) {
        campaigns[campaignId] = {
          campaign_id: campaignId,
          clicks: 0,
          cost: 0
        };
      }
      campaigns[campaignId].clicks++;
      campaigns[campaignId].cost += (click.cost_micros || 0) / 1000000;
    });

    const result = Object.values(campaigns);

    res.json({ 
      campaigns: result,
      total_campaigns: result.length
    });
  } catch (error) {
    console.error('Error fetching campaign clicks:', error);
    res.status(500).json({ error: 'Failed to fetch campaign clicks' });
  }
});

module.exports = router;