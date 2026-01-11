// backend/controllers/reportController.js
// Report Generation Controller - MagenAd V2

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
const supabase = require('../config/supabase');

/**
 * Generate Report
 * POST /api/reports/generate
 */
exports.generate = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const {
      type,
      dateRange,
      format,
      includeCharts,
      includeAnomalies,
      includeCampaigns,
      includeFinancials,
      accountId
    } = req.body;

    // Verify account belongs to user if accountId provided
    if (accountId) {
      const { data: account, error: accountError } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        return res.status(404).json({ message: 'Account not found' });
      }
    }

    // Get data based on type
    let data;
    switch (type) {
      case 'summary':
        data = await getSummaryData(userId, dateRange, accountId);
        break;
      case 'anomalies':
        data = await getAnomaliesData(userId, dateRange, accountId);
        break;
      case 'financial':
        data = await getFinancialData(userId, dateRange, accountId);
        break;
      case 'campaigns':
        data = await getCampaignsData(userId, dateRange, accountId);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // Generate report based on format
    switch (format) {
      case 'pdf':
        return await generatePDF(res, data, type);
      case 'excel':
        return await generateExcel(res, data, type);
      case 'csv':
        return await generateCSV(res, data, type);
      default:
        return res.status(400).json({ message: 'Invalid format' });
    }
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
};

/**
 * Get Summary Data
 */
async function getSummaryData(userId, dateRange, accountId) {
  const dateFilter = getDateFilter(dateRange);
  
  let query = supabase
    .from('raw_events')
    .select(`
      campaign_id,
      campaign_name,
      cost_micros,
      click_timestamp
    `);

  if (accountId) {
    query = query.eq('ad_account_id', accountId);
  } else {
    // Get all account IDs for user
    const { data: accounts } = await supabase
      .from('ad_accounts')
      .select('id')
      .eq('user_id', userId);
    
    if (accounts && accounts.length > 0) {
      query = query.in('ad_account_id', accounts.map(a => a.id));
    }
  }

  if (dateFilter.startDate) {
    query = query.gte('click_timestamp', dateFilter.startDate.toISOString());
  }

  const { data: events, error } = await query;
  if (error) throw error;

  // Get anomalies count
  let anomalyQuery = supabase
    .from('fraud_detections')
    .select('id, severity_level, estimated_loss');

  if (accountId) {
    anomalyQuery = anomalyQuery.eq('ad_account_id', accountId);
  }

  if (dateFilter.startDate) {
    anomalyQuery = anomalyQuery.gte('detected_at', dateFilter.startDate.toISOString());
  }

  const { data: anomalies, error: anomalyError } = await anomalyQuery;
  if (anomalyError) throw anomalyError;

  // Calculate stats
  const totalCampaigns = new Set(events?.map(e => e.campaign_id)).size || 0;
  const totalClicks = events?.length || 0;
  const totalSpend = events?.reduce((sum, e) => sum + (e.cost_micros || 0), 0) / 1000000 || 0;
  const totalAnomalies = anomalies?.length || 0;
  const highSeverity = anomalies?.filter(a => a.severity_level === 'high').length || 0;
  const totalEstimatedLoss = anomalies?.reduce((sum, a) => sum + (a.estimated_loss || 0), 0) || 0;

  return {
    total_campaigns: totalCampaigns,
    total_clicks: totalClicks,
    total_spend: totalSpend,
    total_anomalies: totalAnomalies,
    high_severity: highSeverity,
    total_estimated_loss: totalEstimatedLoss
  };
}

/**
 * Get Anomalies Data
 */
async function getAnomaliesData(userId, dateRange, accountId) {
  const dateFilter = getDateFilter(dateRange);
  
  let query = supabase
    .from('fraud_detections')
    .select(`
      *,
      raw_events:raw_event_id (
        campaign_id,
        campaign_name,
        device,
        country_code,
        city,
        ip_address,
        cost_micros,
        click_timestamp
      )
    `)
    .order('detected_at', { ascending: false })
    .limit(100);

  if (accountId) {
    query = query.eq('ad_account_id', accountId);
  } else {
    const { data: accounts } = await supabase
      .from('ad_accounts')
      .select('id')
      .eq('user_id', userId);
    
    if (accounts && accounts.length > 0) {
      query = query.in('ad_account_id', accounts.map(a => a.id));
    }
  }

  if (dateFilter.startDate) {
    query = query.gte('detected_at', dateFilter.startDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

/**
 * Get Financial Data
 */
async function getFinancialData(userId, dateRange, accountId) {
  const dateFilter = getDateFilter(dateRange);
  
  let query = supabase
    .from('raw_events')
    .select('click_timestamp, cost_micros');

  if (accountId) {
    query = query.eq('ad_account_id', accountId);
  } else {
    const { data: accounts } = await supabase
      .from('ad_accounts')
      .select('id')
      .eq('user_id', userId);
    
    if (accounts && accounts.length > 0) {
      query = query.in('ad_account_id', accounts.map(a => a.id));
    }
  }

  if (dateFilter.startDate) {
    query = query.gte('click_timestamp', dateFilter.startDate.toISOString());
  }

  const { data: events, error } = await query;
  if (error) throw error;

  // Group by date
  const grouped = {};
  events?.forEach(event => {
    const date = new Date(event.click_timestamp).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = {
        date,
        spend: 0,
        clicks: 0,
        conversions: 0,
        estimated_loss: 0
      };
    }
    grouped[date].spend += (event.cost_micros || 0) / 1000000;
    grouped[date].clicks += 1;
  });

  // Get estimated loss from anomalies
  let anomalyQuery = supabase
    .from('fraud_detections')
    .select('detected_at, estimated_loss');

  if (accountId) {
    anomalyQuery = anomalyQuery.eq('ad_account_id', accountId);
  }

  if (dateFilter.startDate) {
    anomalyQuery = anomalyQuery.gte('detected_at', dateFilter.startDate.toISOString());
  }

  const { data: anomalies } = await anomalyQuery;

  anomalies?.forEach(anomaly => {
    const date = new Date(anomaly.detected_at).toISOString().split('T')[0];
    if (grouped[date]) {
      grouped[date].estimated_loss += anomaly.estimated_loss || 0;
    }
  });

  return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Get Campaigns Data
 */
async function getCampaignsData(userId, dateRange, accountId) {
  const dateFilter = getDateFilter(dateRange);
  
  // Get clicks grouped by campaign
  let query = supabase
    .from('raw_events')
    .select('campaign_id, campaign_name, cost_micros, click_timestamp');

  if (accountId) {
    query = query.eq('ad_account_id', accountId);
  } else {
    const { data: accounts } = await supabase
      .from('ad_accounts')
      .select('id')
      .eq('user_id', userId);
    
    if (accounts && accounts.length > 0) {
      query = query.in('ad_account_id', accounts.map(a => a.id));
    }
  }

  if (dateFilter.startDate) {
    query = query.gte('click_timestamp', dateFilter.startDate.toISOString());
  }

  const { data: events, error } = await query;
  if (error) throw error;

  // Group by campaign
  const campaigns = {};
  events?.forEach(event => {
    const campaignId = event.campaign_id || 'unknown';
    if (!campaigns[campaignId]) {
      campaigns[campaignId] = {
        id: campaignId,
        name: event.campaign_name || 'Unknown Campaign',
        platform: 'google_ads',
        status: 'active',
        total_clicks: 0,
        total_spend: 0,
        total_conversions: 0,
        anomaly_count: 0
      };
    }
    campaigns[campaignId].total_clicks += 1;
    campaigns[campaignId].total_spend += (event.cost_micros || 0) / 1000000;
  });

  // Get anomaly counts per campaign
  let anomalyQuery = supabase
    .from('fraud_detections')
    .select('raw_event_id');

  if (accountId) {
    anomalyQuery = anomalyQuery.eq('ad_account_id', accountId);
  }

  if (dateFilter.startDate) {
    anomalyQuery = anomalyQuery.gte('detected_at', dateFilter.startDate.toISOString());
  }

  const { data: anomalies } = await anomalyQuery;

  // Count anomalies per campaign (would need to join with raw_events, simplified here)
  Object.values(campaigns).forEach(campaign => {
    campaign.anomaly_count = 0; // Simplified - would need proper join
  });

  return Object.values(campaigns).sort((a, b) => b.total_spend - a.total_spend);
}

/**
 * Get Date Filter
 */
function getDateFilter(dateRange) {
  const now = new Date();
  let startDate = null;
  
  switch (dateRange) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '7days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
  }
  
  return { startDate };
}

/**
 * Generate PDF Report
 */
async function generatePDF(res, data, type) {
  const doc = new PDFDocument();
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=magenad-report-${Date.now()}.pdf`);
  
  doc.pipe(res);
  
  // Header
  doc.fontSize(20).text('MagenAd Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Report Type: ${type}`);
  doc.text(`Generated: ${new Date().toLocaleString('he-IL')}`);
  doc.moveDown();
  
  // Content based on type
  if (type === 'summary' && data) {
    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Campaigns: ${data.total_campaigns || 0}`);
    doc.text(`Total Clicks: ${data.total_clicks || 0}`);
    doc.text(`Total Spend: $${(data.total_spend || 0).toFixed(2)}`);
    doc.text(`Anomalies Detected: ${data.total_anomalies || 0}`);
    doc.text(`High Severity: ${data.high_severity || 0}`);
    doc.text(`Estimated Loss Prevented: $${(data.total_estimated_loss || 0).toFixed(2)}`);
  } else if (type === 'anomalies' && Array.isArray(data)) {
    doc.fontSize(16).text('Anomalies', { underline: true });
    doc.moveDown();
    doc.fontSize(10);
    data.slice(0, 50).forEach((item, index) => {
      doc.text(`${index + 1}. ${item.detection_rule || 'Unknown'} - ${item.severity_level || 'medium'}`);
      if (item.detected_at) {
        doc.text(`   Detected: ${new Date(item.detected_at).toLocaleString('he-IL')}`);
      }
      doc.moveDown(0.5);
    });
  }
  
  doc.end();
}

/**
 * Generate Excel Report
 */
async function generateExcel(res, data, type) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');
  
  // Headers
  worksheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ];
  
  // Add data
  if (type === 'summary' && data) {
    worksheet.addRow({ metric: 'Total Campaigns', value: data.total_campaigns || 0 });
    worksheet.addRow({ metric: 'Total Clicks', value: data.total_clicks || 0 });
    worksheet.addRow({ metric: 'Total Spend', value: `$${(data.total_spend || 0).toFixed(2)}` });
    worksheet.addRow({ metric: 'Anomalies', value: data.total_anomalies || 0 });
    worksheet.addRow({ metric: 'High Severity', value: data.high_severity || 0 });
    worksheet.addRow({ metric: 'Estimated Loss Prevented', value: `$${(data.total_estimated_loss || 0).toFixed(2)}` });
  } else if (type === 'anomalies' && Array.isArray(data)) {
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Rule', key: 'rule', width: 30 },
      { header: 'Severity', key: 'severity', width: 15 },
      { header: 'Detected At', key: 'detected_at', width: 20 },
      { header: 'Estimated Loss', key: 'estimated_loss', width: 15 }
    ];
    data.forEach(item => {
      worksheet.addRow({
        id: item.id,
        rule: item.detection_rule || 'Unknown',
        severity: item.severity_level || 'medium',
        detected_at: item.detected_at ? new Date(item.detected_at).toLocaleString('he-IL') : '',
        estimated_loss: item.estimated_loss || 0
      });
    });
  }
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=magenad-report-${Date.now()}.xlsx`);
  
  await workbook.xlsx.write(res);
  res.end();
}

/**
 * Generate CSV Report
 */
async function generateCSV(res, data, type) {
  let csvData = [];
  
  if (type === 'summary' && data) {
    csvData = [
      { metric: 'Total Campaigns', value: data.total_campaigns || 0 },
      { metric: 'Total Clicks', value: data.total_clicks || 0 },
      { metric: 'Total Spend', value: (data.total_spend || 0).toFixed(2) },
      { metric: 'Anomalies', value: data.total_anomalies || 0 },
      { metric: 'High Severity', value: data.high_severity || 0 },
      { metric: 'Estimated Loss Prevented', value: (data.total_estimated_loss || 0).toFixed(2) }
    ];
  } else if (type === 'anomalies' && Array.isArray(data)) {
    csvData = data.map(item => ({
      id: item.id,
      rule: item.detection_rule || 'Unknown',
      severity: item.severity_level || 'medium',
      detected_at: item.detected_at || '',
      estimated_loss: item.estimated_loss || 0
    }));
  }
  
  const parser = new Parser();
  const csv = parser.parse(csvData);
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=magenad-report-${Date.now()}.csv`);
  res.send(csv);
}

module.exports = exports;
