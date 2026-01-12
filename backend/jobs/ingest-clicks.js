/*
 * ================================================
 * Data Ingestion Job - Google Ads Clicks Sync
 * ================================================
 * 
 * מטרה: משיכת נתוני clicks מ-Google Ads API כל 6 שעות
 * 
 * תזמון: כל 6 שעות (00:00, 06:00, 12:00, 18:00)
 * Schedule: '0 0,6,12,18 * * *'
 * 
 * מה הJob עושה:
 * ---------------
 * 1. שולף רשימת חשבונות פעילים
 * 2. לכל חשבון - משיכת clicks מ-Google Ads
 * 3. שמירה ב-raw_events table
 * 4. עדכון last_sync_at
 * 5. לוגים + error handling
 * 
 * תלויות:
 * --------
 * - node-cron
 * - ClicksService
 * - Supabase Client
 * 
 * הפעלה ידנית:
 * -------------
 * node backend/jobs/ingest-clicks.js
 * 
 * ================================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config(); // Fallback to .env

const cron = require('node-cron');
const supabase = require('../config/supabase');
const ClicksService = require('../services/ClicksService');

/**
 * Main Ingestion Function
 */
async function ingestClicks() {
  const startTime = Date.now();
  console.log('\n🔄 [INGEST-JOB] Starting clicks ingestion...');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  try {
    // 1. Get all active ad accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id, user_id, google_customer_id, account_name, last_sync_at')
      .eq('is_active', true)
      .order('last_sync_at', { ascending: true, nullsFirst: true });
    
    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('⚠️  No active accounts found');
      return;
    }
    
    console.log(`📊 Found ${accounts.length} active accounts`);
    
    // 2. Process each account
    let totalClicks = 0;
    let successCount = 0;
    let failCount = 0;
    
    for (const account of accounts) {
      try {
        console.log(`\n📥 Processing account: ${account.account_name} (${account.google_customer_id})`);
        
        // Get refresh token for this account
        const { data: accountData, error: accountDataError } = await supabase
          .from('ad_accounts')
          .select('refresh_token')
          .eq('id', account.id)
          .single();
        
        if (accountDataError || !accountData.refresh_token) {
          console.log('   ⚠️  No refresh token found, skipping');
          continue;
        }
        
        // Calculate date range (last sync or last 24 hours)
        const now = new Date();
        const lastSync = account.last_sync_at ? new Date(account.last_sync_at) : null;
        const days = lastSync ? Math.ceil((now - lastSync) / (1000 * 60 * 60 * 24)) : 1;
        
        console.log(`   📅 Fetching clicks for last ${days} day(s)`);
        
        // Get clicks from Google Ads using ClicksService
        const clicksService = new ClicksService();
        const clicks = await clicksService.getClicks(
          account.google_customer_id,
          accountData.refresh_token,
          { days: Math.min(days, 7) } // Max 7 days
        );
        
        if (!clicks || clicks.length === 0) {
          console.log('   ℹ️  No new clicks found');
          // Still update sync time
          await supabase
            .from('ad_accounts')
            .update({ 
              last_sync_at: now.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', account.id);
          continue;
        }
        
        console.log(`   ✅ Fetched ${clicks.length} clicks`);
        
        // 3. Save to raw_events using ClicksService
        await clicksService.saveClicks(clicks, account.id);
        
        // 4. Update last_sync_at
        const { error: updateError } = await supabase
          .from('ad_accounts')
          .update({ 
            last_sync_at: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', account.id);
        
        if (updateError) {
          console.error(`   ⚠️  Failed to update sync time: ${updateError.message}`);
        }
        
        totalClicks += clicks.length;
        successCount++;
        console.log(`   ✅ Successfully ingested ${clicks.length} clicks`);
        
      } catch (accountError) {
        console.error(`   ❌ Error processing account ${account.account_name}:`, accountError.message);
        failCount++;
      }
    }
    
    // 5. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('📊 INGESTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}/${accounts.length} accounts`);
    console.log(`❌ Failed: ${failCount}/${accounts.length} accounts`);
    console.log(`📈 Total clicks ingested: ${totalClicks}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60) + '\n');
    
    // 6. Log to database
    await logJobExecution('ingest-clicks', {
      accounts_processed: accounts.length,
      successful: successCount,
      failed: failCount,
      total_clicks: totalClicks,
      duration_seconds: parseFloat(duration)
    });
    
  } catch (error) {
    console.error('\n❌ [INGEST-JOB] Fatal error:', error);
    
    // Log error
    await logJobExecution('ingest-clicks', {
      error: error.message,
      stack: error.stack
    }, 'failed');
    
    throw error;
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
  // Run every 6 hours at minute 0
  // Schedule: 00:00, 06:00, 12:00, 18:00
  const schedule = '0 */6 * * *';
  
  console.log(`⏰ [INGEST-JOB] Scheduled with cron: ${schedule}`);
  console.log('📅 Next runs: 00:00, 06:00, 12:00, 18:00');
  
  cron.schedule(schedule, async () => {
    try {
      await ingestClicks();
    } catch (error) {
      console.error('[INGEST-JOB] Cron execution failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jerusalem" // Israel timezone
  });
  
  console.log('✅ [INGEST-JOB] Cron job is active and running');
}

/**
 * Run immediately if executed directly
 */
if (require.main === module) {
  console.log('🚀 Running ingestion job manually...');
  ingestClicks()
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

module.exports = { ingestClicks, setupCronJob };
