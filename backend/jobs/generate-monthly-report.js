/*
 * ================================================
 * Monthly Report Generation Job
 * ================================================
 * 
 * מטרה: יצירת דוח חודשי לכל חשבון פעיל
 * 
 * תזמון: 1 לחודש ב-00:05
 * Schedule: '5 0 1 * *'
 * 
 * מה הJob עושה:
 * ---------------
 * 1. שולף רשימת חשבונות פעילים
 * 2. לכל חשבון - מחשב דוח חודשי (חודש שעבר)
 * 3. שומר ב-monthly_reports table
 * 4. שולח WhatsApp (אם מוגדר)
 * 5. לוגים + error handling
 * 
 * ================================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config();

const cron = require('node-cron');
const supabase = require('../config/supabase');
const QuietIndexService = require('../services/QuietIndexService');

/**
 * Main Monthly Report Generation Function
 */
async function generateMonthlyReports() {
  const startTime = Date.now();
  console.log('\n📊 [MONTHLY-REPORT-JOB] Starting monthly report generation...');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  try {
    // 1. Calculate last month
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1; // 1-12
    
    console.log(`📅 Generating reports for: ${year}-${month.toString().padStart(2, '0')}`);
    
    // 2. Get date range (start and end of last month)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    console.log(`   📆 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // 3. Get all active ad accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id, user_id, google_customer_id, account_name, is_active')
      .eq('is_active', true);
    
    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('⚠️  No active accounts found');
      return;
    }
    
    console.log(`📊 Found ${accounts.length} active accounts`);
    
    // 4. Process each account
    let successCount = 0;
    let failCount = 0;
    let totalReports = 0;
    
    for (const account of accounts) {
      try {
        console.log(`\n📈 Processing account: ${account.account_name} (${account.google_customer_id})`);
        
        // 5. Generate report for account
        const report = await generateReport(account.id, year, month, startDate, endDate);
        
        if (!report) {
          console.log('   ⚠️  No data for report');
          continue;
        }
        
        // 6. Save to monthly_reports table
        const { data: savedReport, error: saveError } = await supabase
          .from('monthly_reports')
          .upsert({
            ad_account_id: account.id,
            report_year: year,
            report_month: month,
            total_clicks: report.total_clicks,
            total_detections: report.total_detections,
            total_actions_taken: report.total_actions_taken,
            estimated_saved_amount: report.estimated_saved_amount,
            quiet_index: report.quiet_index,
            quiet_status: report.quiet_status,
            top_campaigns_suspicious: report.top_campaigns_suspicious,
            high_severity_count: report.high_severity_count,
            medium_severity_count: report.medium_severity_count,
            low_severity_count: report.low_severity_count,
            whatsapp_sent: false,
            generated_at: new Date().toISOString()
          }, {
            onConflict: 'ad_account_id,report_year,report_month'
          })
          .select()
          .single();
        
        if (saveError) {
          throw new Error(`Failed to save report: ${saveError.message}`);
        }
        
        console.log('   ✅ Report saved to database');
        
        // 7. Send WhatsApp (if configured)
        if (savedReport) {
          await sendWhatsAppReport(account, savedReport);
        }
        
        successCount++;
        totalReports++;
        console.log(`   ✅ Successfully generated monthly report`);
        
      } catch (accountError) {
        console.error(`   ❌ Error processing account ${account.account_name}:`, accountError.message);
        failCount++;
      }
    }
    
    // 8. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('📊 MONTHLY REPORT GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}/${accounts.length} accounts`);
    console.log(`❌ Failed: ${failCount}/${accounts.length} accounts`);
    console.log(`📈 Total reports generated: ${totalReports}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60) + '\n');
    
    // 9. Log to database
    await logJobExecution('generate-monthly-report', {
      year: year,
      month: month,
      accounts_processed: accounts.length,
      successful: successCount,
      failed: failCount,
      total_reports: totalReports,
      duration_seconds: parseFloat(duration)
    });
    
  } catch (error) {
    console.error('\n❌ [MONTHLY-REPORT-JOB] Fatal error:', error);
    
    await logJobExecution('generate-monthly-report', {
      error: error.message,
      stack: error.stack
    }, 'failed');
    
    throw error;
  }
}

/**
 * Generate report for a single account
 */
async function generateReport(accountId, year, month, startDate, endDate) {
  try {
    // 1. Count total clicks
    const { count: totalClicks, error: clicksError } = await supabase
      .from('raw_events')
      .select('*', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .gte('click_timestamp', startDate.toISOString())
      .lte('click_timestamp', endDate.toISOString());
    
    if (clicksError) {
      throw new Error(`Failed to count clicks: ${clicksError.message}`);
    }
    
    if (totalClicks === 0) {
      return null; // No data
    }
    
    // 2. Count detections
    const { count: totalDetections, error: detectionsError } = await supabase
      .from('detections')
      .select('*', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (detectionsError) {
      throw new Error(`Failed to count detections: ${detectionsError.message}`);
    }
    
    // 3. Count actions taken
    const { count: totalActions, error: actionsError } = await supabase
      .from('detections')
      .select('*', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('action_taken', 'is', null);
    
    if (actionsError) {
      throw new Error(`Failed to count actions: ${actionsError.message}`);
    }
    
    // 4. Count by severity
    const { data: detectionsBySeverity, error: severityError } = await supabase
      .from('detections')
      .select('severity')
      .eq('ad_account_id', accountId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    if (severityError) {
      throw new Error(`Failed to count by severity: ${severityError.message}`);
    }
    
    const highSeverityCount = detectionsBySeverity?.filter(d => d.severity === 'high').length || 0;
    const mediumSeverityCount = detectionsBySeverity?.filter(d => d.severity === 'medium').length || 0;
    const lowSeverityCount = detectionsBySeverity?.filter(d => d.severity === 'low').length || 0;
    
    // 5. Calculate Quiet Index
    const quietIndex = await QuietIndexService.calculateQI(accountId, {
      days: 30,
      useCache: false
    });
    
    const qi = quietIndex?.qi || 100;
    const quietStatus = qi >= 80 ? 'quiet' : qi >= 60 ? 'normal' : 'warning';
    
    // 6. Get top campaigns with most detections
    const { data: topCampaigns, error: campaignsError } = await supabase
      .from('detections')
      .select('campaign_id, severity')
      .eq('ad_account_id', accountId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('campaign_id', 'is', null);
    
    if (campaignsError) {
      throw new Error(`Failed to get top campaigns: ${campaignsError.message}`);
    }
    
    // Count detections per campaign
    const campaignCounts = {};
    for (const detection of topCampaigns || []) {
      const campaignId = detection.campaign_id;
      if (!campaignCounts[campaignId]) {
        campaignCounts[campaignId] = { total: 0, high: 0, medium: 0, low: 0 };
      }
      campaignCounts[campaignId].total++;
      campaignCounts[campaignId][detection.severity]++;
    }
    
    // Sort and get top 5
    const topCampaignsList = Object.entries(campaignCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([campaignId, counts]) => ({
        campaign_id: campaignId,
        ...counts
      }));
    
    // 7. Calculate estimated saved amount
    // Get average cost per click
    const { data: clicksWithCost, error: costError } = await supabase
      .from('raw_events')
      .select('cost_micros')
      .eq('ad_account_id', accountId)
      .gte('click_timestamp', startDate.toISOString())
      .lte('click_timestamp', endDate.toISOString())
      .not('cost_micros', 'is', null)
      .limit(1000);
    
    let avgCostPerClick = 0;
    if (clicksWithCost && clicksWithCost.length > 0) {
      const totalCost = clicksWithCost.reduce((sum, c) => sum + (c.cost_micros || 0), 0);
      avgCostPerClick = (totalCost / clicksWithCost.length) / 1000000; // Convert from micros
    }
    
    const estimatedSavedAmount = totalDetections * avgCostPerClick;
    
    // 8. Calculate system stats
    const daysWithData = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const scansPerformed = daysWithData * 24; // Hourly scans
    
    return {
      total_clicks: totalClicks || 0,
      total_detections: totalDetections || 0,
      total_actions_taken: totalActions || 0,
      estimated_saved_amount: estimatedSavedAmount,
      quiet_index: qi,
      quiet_status: quietStatus,
      top_campaigns_suspicious: topCampaignsList,
      high_severity_count: highSeverityCount,
      medium_severity_count: mediumSeverityCount,
      low_severity_count: lowSeverityCount,
      system_active_days: daysWithData,
      scans_performed: scansPerformed
    };
  } catch (error) {
    console.error(`Error generating report for account ${accountId}:`, error);
    throw error;
  }
}

/**
 * Send WhatsApp Report
 */
async function sendWhatsAppReport(account, report) {
  try {
    // Check if WhatsAppService exists
    let WhatsAppService;
    try {
      WhatsAppService = require('../services/WhatsAppService');
    } catch (e) {
      console.log('   ⚠️  WhatsAppService not found, skipping WhatsApp send');
      return;
    }
    
    // Get user WhatsApp number
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('whatsapp_number')
      .eq('id', account.user_id)
      .single();
    
    if (userError || !user || !user.whatsapp_number) {
      console.log('   ⚠️  No WhatsApp number configured for user');
      return;
    }
    
    // Send report
    const result = await WhatsAppService.sendMonthlyReport(user.whatsapp_number, report);
    
    if (result.success) {
      // Update report status
      await supabase
        .from('monthly_reports')
        .update({
          whatsapp_sent: true,
          whatsapp_sent_at: new Date().toISOString()
        })
        .eq('id', report.id);
      
      console.log('   ✅ WhatsApp report sent');
    } else {
      console.log(`   ⚠️  Failed to send WhatsApp: ${result.error}`);
    }
  } catch (error) {
    console.error('Error sending WhatsApp report:', error);
    // Don't throw - WhatsApp is not critical
  }
}

/**
 * Log Job Execution to Database
 */
async function logJobExecution(jobName, metadata, status = 'success') {
  try {
    await supabase
      .from('job_logs')
      .insert({
        job_name: jobName,
        status: status,
        metadata: metadata,
        executed_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log job execution:', error.message);
  }
}

/**
 * Setup Cron Job
 */
function setupCronJob() {
  // Run on 1st of month at 00:05
  const schedule = '5 0 1 * *';
  
  console.log(`⏰ [MONTHLY-REPORT-JOB] Scheduled with cron: ${schedule}`);
  console.log('📅 Runs on 1st of month at 00:05');
  
  cron.schedule(schedule, async () => {
    try {
      await generateMonthlyReports();
    } catch (error) {
      console.error('[MONTHLY-REPORT-JOB] Cron execution failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jerusalem"
  });
  
  console.log('✅ [MONTHLY-REPORT-JOB] Cron job is active and running');
}

/**
 * Run immediately if executed directly
 */
if (require.main === module) {
  console.log('🚀 Running monthly report generation manually...');
  generateMonthlyReports()
    .then(() => {
      console.log('✅ Manual execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Manual execution failed:', error);
      process.exit(1);
    });
} else {
  // Setup cron when required as module
  setupCronJob();
}

module.exports = { generateMonthlyReports, setupCronJob };
