/*
 * ipblocking.js (routes)
 * 
 * IP Blocking Management API:
 * - GET /api/ipblocking/:accountId/blacklist - Get blacklist
 * - POST /api/ipblocking/:accountId/blacklist - Block IP
 * - DELETE /api/ipblocking/:accountId/blacklist/:ip - Unblock IP
 * - GET /api/ipblocking/:accountId/whitelist - Get whitelist
 * - POST /api/ipblocking/:accountId/whitelist - Whitelist IP
 * - DELETE /api/ipblocking/:accountId/whitelist/:ip - Remove from whitelist
 * - POST /api/ipblocking/:accountId/bulk-block - Bulk block IPs
 * - GET /api/ipblocking/:accountId/stats - Get blocking stats
 * - GET /api/ipblocking/:accountId/check/:ip - Check if IP blocked/whitelisted
 */

const express = require('express');
const router = express.Router();
const ipBlockingService = require('../services/IPBlockingService');
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

// Get blacklist
router.get('/:accountId/blacklist', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { includeExpired } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const blacklist = await ipBlockingService.getBlacklist(
      accountId,
      includeExpired === 'true'
    );

    res.json({ success: true, blacklist, count: blacklist.length });
  } catch (error) {
    console.error('Error getting blacklist:', error);
    res.status(500).json({ error: 'Failed to get blacklist' });
  }
});

// Block IP
router.post('/:accountId/blacklist', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const ipData = req.body;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const blocked = await ipBlockingService.blockIP(accountId, ipData);

    res.json({ success: true, blocked });
  } catch (error) {
    console.error('Error blocking IP:', error);
    res.status(500).json({ error: error.message || 'Failed to block IP' });
  }
});

// Unblock IP
router.delete('/:accountId/blacklist/:ip', authenticateToken, async (req, res) => {
  try {
    const { accountId, ip } = req.params;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const unblocked = await ipBlockingService.unblockIP(accountId, ip);

    res.json({ success: true, unblocked });
  } catch (error) {
    console.error('Error unblocking IP:', error);
    res.status(500).json({ error: 'Failed to unblock IP' });
  }
});

// Get whitelist
router.get('/:accountId/whitelist', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const whitelist = await ipBlockingService.getWhitelist(accountId);

    res.json({ success: true, whitelist, count: whitelist.length });
  } catch (error) {
    console.error('Error getting whitelist:', error);
    res.status(500).json({ error: 'Failed to get whitelist' });
  }
});

// Whitelist IP
router.post('/:accountId/whitelist', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const ipData = req.body;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const whitelisted = await ipBlockingService.whitelistIP(accountId, ipData);

    res.json({ success: true, whitelisted });
  } catch (error) {
    console.error('Error whitelisting IP:', error);
    res.status(500).json({ error: error.message || 'Failed to whitelist IP' });
  }
});

// Remove from whitelist
router.delete('/:accountId/whitelist/:ip', authenticateToken, async (req, res) => {
  try {
    const { accountId, ip } = req.params;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    await ipBlockingService.removeFromWhitelist(accountId, ip);

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from whitelist:', error);
    res.status(500).json({ error: 'Failed to remove from whitelist' });
  }
});

// Bulk block
router.post('/:accountId/bulk-block', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { ipAddresses, reason } = req.body;

    if (!Array.isArray(ipAddresses) || ipAddresses.length === 0) {
      return res.status(400).json({ error: 'IP addresses array required' });
    }

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const result = await ipBlockingService.bulkBlockIPs(accountId, ipAddresses, reason);

    res.json({
      success: true,
      blocked: result.blocked.length,
      failed: result.failed.length,
      details: result
    });
  } catch (error) {
    console.error('Error bulk blocking:', error);
    res.status(500).json({ error: 'Failed to bulk block IPs' });
  }
});

// Get stats
router.get('/:accountId/stats', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const stats = await ipBlockingService.getBlockingStats(accountId);

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Check IP
router.get('/:accountId/check/:ip', authenticateToken, async (req, res) => {
  try {
    const { accountId, ip } = req.params;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const [blocked, whitelisted] = await Promise.all([
      ipBlockingService.isBlocked(accountId, ip),
      ipBlockingService.isWhitelisted(accountId, ip)
    ]);

    res.json({
      success: true,
      ip,
      blocked,
      whitelisted,
      status: whitelisted ? 'whitelisted' : blocked ? 'blocked' : 'allowed'
    });
  } catch (error) {
    console.error('Error checking IP:', error);
    res.status(500).json({ error: 'Failed to check IP' });
  }
});

module.exports = router;