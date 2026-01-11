/*
 * ================================================
 * Baseline Calculation Job
 * ================================================
 * 
 * מטרה: חישוב baseline statistics לכל חשבון פעיל
 * 
 * תזמון: כל יום ב-02:00 בלילה
 * Schedule: '0 2 * * *'
 * 
 * מה הJob עושה:
 * ---------------
 * 1. שולף רשימת חשבונות פעילים
 * 2. לכל חשבון - מחשב baseline stats מ-raw_events
 * 3. שומר ב-baseline_stats table
 * 4. מעדכן detection_state.learning_mode
 * 5. מחשב Quiet Index
 * 6. לוגים + error handling
 * 
 * ================================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config(); // Fallback to .env

const cron = require('node-cron');
const supabase = require('../config/supabase');
const quietIndexService = require('../services/QuietIndexService');

/**
 * Main Baseline Calculation Function
 */
async function calculateBaseline() {
  const startTime = Date.now();
  console.log('\n📊 [BASELINE-JOB] Starting baseline calculation...');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  try {
    // 1. Get all active ad accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id, user_id, google_customer_id, account_name, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    
    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('⚠️  No active accounts found');
      return;
    }
    
    console.log(`📊 Found ${accounts.length} active accounts`);
    
    // 2. Process each account
    let successCount = 0;
    let failCount = 0;
    let totalBaselines = 0;
    
    for (const account of accounts) {
      try {
        console.log(`\n📈 Processing account: ${account.account_name} (${account.google_customer_id})`);
        
        // Check if account has enough data (at least 7 days)
        const accountAge = Date.now() - new Date(account.created_at).getTime();
        const daysOld = accountAge / (1000 * 60 * 60 * 24);
        
        console.log(`   📅 Account age: ${daysOld.toFixed(1)} days`);
        
        if (daysOld < 7) {
          console.log('   ⏳ Account too new for baseline (need 7 days)');
          continue;
        }
        
        // 3. Get raw_events for last 14 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 14);
        
        const { data: events, error: eventsError } = await supabase
          .from('raw_events')
          .select('*')
          .eq('ad_account_id', account.id)
          .gte('click_timestamp', startDate.toISOString());
        
        if (eventsError) {
          throw new Error(`Failed to fetch events: ${eventsError.message}`);
        }
        
        if (!events || events.length === 0) {
          console.log('   ℹ️  No events found for baseline calculation');
          continue;
        }
        
        console.log(`   📊 Found ${events.length} events for baseline`);
        
        // 4. Calculate baseline statistics
        const baseline = calculateBaselineStats(events);
        
        // 5. Save baseline to database
        const { error: insertError } = await supabase
          .from('baseline_stats')
          .upsert({
            ad_account_id: account.id,
            user_id: account.user_id,
            avg_clicks_per_hour: baseline.avg_clicks_per_hour,
            avg_cost_per_click: baseline.avg_cost_per_click,
            std_clicks_per_hour: baseline.std_clicks_per_hour,
            device_distribution: baseline.device_distribution,
            network_distribution: baseline.network_distribution,
            geographic_distribution: baseline.geographic_distribution,
            sample_size: events.length,
            calculated_at: new Date().toISOString(),
            valid_from: startDate.toISOString(),
            valid_to: new Date().toISOString()
          }, {
            onConflict: 'ad_account_id'
          });
        
        if (insertError) {
          console.error(`   ❌ Failed to save baseline: ${insertError.message}`);
          failCount++;
          continue;
        }
        
        console.log('   ✅ Baseline saved to database');
        
        // 6. Calculate Quiet Index
        console.log('   🤫 Calculating Quiet Index...');
        
        const quietIndex = await quietIndexService.calculateQI(account.id, { days: 14 });
        
        if (quietIndex) {
          console.log(`   ✅ Quiet Index: ${quietIndex.qi.toFixed(2)}`);
          
          // Save Quiet Index
          await supabase
            .from('quiet_index')
            .upsert({
              ad_account_id: account.id,
              user_id: account.user_id,
              overall_score: quietIndex.qi,
              metrics: quietIndex,
              calculated_at: new Date().toISOString()
            }, {
              onConflict: 'ad_account_id'
            });
        }
        
        // 7. Update detection state
        // Check if we have enough data to exit learning mode
        const shouldExitLearning = events.length >= 1000 && daysOld >= 14;
        
        if (shouldExitLearning) {
          const { data: detectionState } = await supabase
            .from('detection_state')
            .select('learning_mode')
            .eq('ad_account_id', account.id)
            .single();
          
          if (detectionState?.learning_mode === true) {
            await supabase
              .from('detection_state')
              .update({
                learning_mode: false,
                baseline_established_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('ad_account_id', account.id);
            
            console.log('   🎓 Account exited learning mode!');
          }
        } else {
          console.log(`   📚 Still in learning mode (need ${1000 - events.length} more events)`);
        }
        
        successCount++;
        totalBaselines++;
        console.log(`   ✅ Successfully processed baseline`);
        
      } catch (accountError) {
        console.error(`   ❌ Error processing account ${account.account_name}:`, accountError.message);
        failCount++;
      }
    }
    
    // 8. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('📊 BASELINE CALCULATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}/${accounts.length} accounts`);
    console.log(`❌ Failed: ${failCount}/${accounts.length} accounts`);
    console.log(`📈 Total baselines calculated: ${totalBaselines}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60) + '\n');
    
    // 9. Log to database
    await logJobExecution('calculate-baseline', {
      accounts_processed: accounts.length,
      successful: successCount,
      failed: failCount,
      total_baselines: totalBaselines,
      duration_seconds: parseFloat(duration)
    });
    
  } catch (error) {
    console.error('\n❌ [BASELINE-JOB] Fatal error:', error);
    
    await logJobExecution('calculate-baseline', {
      error: error.message,
      stack: error.stack
    }, 'failed');
    
    throw error;
  }
}

/**
 * Calculate Baseline Statistics from events
 */
function calculateBaselineStats(events) {
  // Calculate clicks per hour
  const hours = {};
  events.forEach(event => {
    const hour = new Date(event.click_timestamp).getHours();
    hours[hour] = (hours[hour] || 0) + 1;
  });
  
  const clicksPerHour = Object.values(hours);
  const avgClicksPerHour = clicksPerHour.reduce((a, b) => a + b, 0) / clicksPerHour.length || 0;
  const stdClicksPerHour = calculateStdDev(clicksPerHour);
  
  // Calculate cost per click
  const costs = events.filter(e => e.cost_micros).map(e => e.cost_micros / 1000000);
  const avgCostPerClick = costs.reduce((a, b) => a + b, 0) / costs.length || 0;
  
  // Device distribution
  const deviceCounts = {};
  events.forEach(event => {
    const device = event.device || 'UNKNOWN';
    deviceCounts[device] = (deviceCounts[device] || 0) + 1;
  });
  const deviceDistribution = {};
  Object.keys(deviceCounts).forEach(device => {
    deviceDistribution[device] = deviceCounts[device] / events.length;
  });
  
  // Network distribution
  const networkCounts = {};
  events.forEach(event => {
    const network = event.network || 'UNKNOWN';
    networkCounts[network] = (networkCounts[network] || 0) + 1;
  });
  const networkDistribution = {};
  Object.keys(networkCounts).forEach(network => {
    networkDistribution[network] = networkCounts[network] / events.length;
  });
  
  // Geographic distribution
  const geoCounts = {};
  events.forEach(event => {
    const country = event.country_code || 'UNKNOWN';
    geoCounts[country] = (geoCounts[country] || 0) + 1;
  });
  const geographicDistribution = {};
  Object.keys(geoCounts).forEach(country => {
    geographicDistribution[country] = geoCounts[country] / events.length;
  });
  
  return {
    avg_clicks_per_hour: avgClicksPerHour,
    std_clicks_per_hour: stdClicksPerHour,
    avg_cost_per_click: avgCostPerClick,
    device_distribution: deviceDistribution,
    network_distribution: networkDistribution,
    geographic_distribution: geographicDistribution
  };
}

/**
 * Calculate Standard Deviation
 */
function calculateStdDev(values) {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
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
  // Run daily at 2:00 AM
  const schedule = '0 2 * * *';
  
  console.log(`⏰ [BASELINE-JOB] Scheduled with cron: ${schedule}`);
  console.log('📅 Runs daily at 02:00 AM');
  
  cron.schedule(schedule, async () => {
    try {
      await calculateBaseline();
    } catch (error) {
      console.error('[BASELINE-JOB] Cron execution failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jerusalem" // Israel timezone
  });
  
  console.log('✅ [BASELINE-JOB] Cron job is active and running');
}

/**
 * Run immediately if executed directly
 */
if (require.main === module) {
  console.log('🚀 Running baseline calculation manually...');
  calculateBaseline()
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

module.exports = { calculateBaseline, setupCronJob };
