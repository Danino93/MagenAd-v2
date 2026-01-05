/*
 * reports.js (routes)
 * 
 * Reports & Export API:
 * - GET /api/reports/:accountId - Get all reports
 * - POST /api/reports/:accountId/generate - Generate new report
 * - GET /api/reports/:accountId/:reportId - Get specific report
 * - GET /api/reports/:accountId/export - Export data (CSV/JSON)
 */

const express = require('express');
const router = express.Router();
const reportService = require('../services/ReportService');
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

// Get all reports
router.get('/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { type, limit = 10 } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    let query = supabase
      .from('reports')
      .select('*')
      .eq('ad_account_id', accountId)
      .order('generated_at', { ascending: false })
      .limit(parseInt(limit));

    if (type) query = query.eq('report_type', type);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, reports: data || [] });
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
});

// Generate report
router.post('/:accountId/generate', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { period, format, startDate, endDate } = req.body;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const report = await reportService.generateReport(accountId, {
      period,
      format,
      startDate,
      endDate
    });

    res.json({ success: true, report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get specific report
router.get('/:accountId/:reportId', authenticateToken, async (req, res) => {
  try {
    const { accountId, reportId } = req.params;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('ad_account_id', accountId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Report not found' });

    res.json({ success: true, report: data });
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

// Export data
router.get('/:accountId/export', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { type, startDate, endDate, format = 'csv' } = req.query;

    const { data: account } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', req.user.id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    if (format === 'csv') {
      const csv = await reportService.exportToCSV(accountId, type, start, end);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
      res.send(csv);
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router;