/*
 * ================================================
 * Detection Job - Updated with New Rule System
 * ================================================
 * 
 * מטרה: הרצת כל חוקי הזיהוי על חשבונות פעילים
 * 
 * תזמון: כל שעה
 * Schedule: '0 * * * *'
 * 
 * מה הJob עושה:
 * ---------------
 * 1. שולף רשימת חשבונות פעילים (לא ב-Learning Mode)
 * 2. לכל חשבון - טוען profile
 * 3. מריץ את כל 12 החוקים
 * 4. שומר detections ל-DB
 * 5. מעדכן detection_state
 * 6. שולח alerts ל-high severity
 * 7. לוגים + error handling
 * 
 * ================================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config();

const cron = require('node-cron');
const supabase = require('../config/supabase');

// ייבוא כל החוקים
const A1_RapidRepeat = require('../rules/A1-RapidRepeat');
const A2_ShortWindow = require('../rules/A2-ShortWindow');
const A3_DailyRepeat = require('../rules/A3-DailyRepeat');
const B1_AccountSpike = require('../rules/B1-AccountSpike');
const B2_CampaignSpike = require('../rules/B2-CampaignSpike');
const B3_MicroBurst = require('../rules/B3-MicroBurst');
const C1_OffHours = require('../rules/C1-OffHours');
const C2_NightBurst = require('../rules/C2-NightBurst');
const D1_NetworkShift = require('../rules/D1-NetworkShift');
const E1_MultiRule = require('../rules/E1-MultiRule');
const E2_SuspiciousScore = require('../rules/E2-SuspiciousScore');

// מערך כל החוקים
const RULES = [
  new A1_RapidRepeat(),
  new A2_ShortWindow(),
  new A3_DailyRepeat(),
  new B1_AccountSpike(),
  new B2_CampaignSpike(),
  new B3_MicroBurst(),
  new C1_OffHours(),
  new C2_NightBurst(),
  new D1_NetworkShift(),
  new E1_MultiRule(),
  new E2_SuspiciousScore()
];

/**
 * Main Detection Function
 */
async function runDetection() {
  const startTime = Date.now();
  console.log('\n🔍 [DETECTION-JOB] Starting detection run...');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  try {
    // 1. Get all active ad accounts (not in learning mode)
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id, user_id, google_customer_id, account_name, is_active')
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
    
    // 2. Check learning mode for each account
    let processedCount = 0;
    let skippedCount = 0;
    let totalDetections = 0;
    let highSeverityCount = 0;
    
    for (const account of accounts) {
      try {
        // Check if account is in learning mode
        const { data: detectionState } = await supabase
          .from('detection_state')
          .select('learning_mode')
          .eq('ad_account_id', account.id)
          .single();
        
        if (detectionState?.learning_mode === true) {
          console.log(`⏭️  Skipping account ${account.account_name} (learning mode)`);
          skippedCount++;
          continue;
        }
        
        console.log(`\n📈 Processing account: ${account.account_name} (${account.google_customer_id})`);
        
        // 3. Run all detection rules
        const accountDetections = await runDetectionForAccount(account);
        
        // 4. Save detections to database
        let savedCount = 0;
        for (const rule of RULES) {
          if (accountDetections[rule.ruleId] && accountDetections[rule.ruleId].length > 0) {
            const saved = await rule.saveDetections(account.id, accountDetections[rule.ruleId]);
            savedCount += saved.length;
            
            // Count high severity
            const highSeverity = saved.filter(d => d.severity === 'high').length;
            highSeverityCount += highSeverity;
          }
        }
        
        totalDetections += savedCount;
        console.log(`   ✅ Found ${savedCount} detections`);
        
        // 5. Update detection_state
        await updateDetectionState(account.id, savedCount, highSeverityCount);
        
        // 6. Send alerts for high severity
        if (highSeverityCount > 0) {
          await sendAlerts(account, accountDetections);
        }
        
        processedCount++;
        
      } catch (accountError) {
        console.error(`   ❌ Error processing account ${account.account_name}:`, accountError.message);
        // Continue with next account
      }
    }
    
    // 7. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DETECTION JOB SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Processed: ${processedCount}/${accounts.length} accounts`);
    console.log(`⏭️  Skipped: ${skippedCount} accounts (learning mode)`);
    console.log(`🔍 Total detections: ${totalDetections}`);
    console.log(`🔴 High severity: ${highSeverityCount}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60) + '\n');
    
    // 8. Log to database
    await logJobExecution('run-detection', {
      accounts_processed: accounts.length,
      successful: processedCount,
      skipped: skippedCount,
      total_detections: totalDetections,
      high_severity: highSeverityCount,
      duration_seconds: parseFloat(duration)
    });
    
  } catch (error) {
    console.error('\n❌ [DETECTION-JOB] Fatal error:', error);
    
    await logJobExecution('run-detection', {
      error: error.message,
      stack: error.stack
    }, 'failed');
    
    throw error;
  }
}

/**
 * Run detection for a single account
 */
async function runDetectionForAccount(account) {
  const allDetections = {};
  
  // Initialize detection arrays for each rule
  for (const rule of RULES) {
    allDetections[rule.ruleId] = [];
  }
  
  // Run each rule
  for (const rule of RULES) {
    try {
      console.log(`   🔍 Running rule ${rule.ruleId}: ${rule.ruleName}...`);
      
      const detections = await rule.detect(account);
      
      if (detections && detections.length > 0) {
        allDetections[rule.ruleId] = detections;
        console.log(`      ✅ Found ${detections.length} detections`);
      } else {
        console.log(`      ℹ️  No detections`);
      }
    } catch (ruleError) {
      console.error(`      ❌ Error in rule ${rule.ruleId}:`, ruleError.message);
      // Continue with next rule
    }
  }
  
  return allDetections;
}

/**
 * Update detection_state table
 */
async function updateDetectionState(accountId, detectionCount, highSeverityCount) {
  try {
    // Get current state
    const { data: currentState } = await supabase
      .from('detection_state')
      .select('*')
      .eq('ad_account_id', accountId)
      .single();
    
    if (currentState) {
      // Update existing state
      await supabase
        .from('detection_state')
        .update({
          total_anomalies: (currentState.total_anomalies || 0) + detectionCount,
          high_severity_anomalies: (currentState.high_severity_anomalies || 0) + highSeverityCount,
          updated_at: new Date().toISOString()
        })
        .eq('ad_account_id', accountId);
    } else {
      // Create new state
      await supabase
        .from('detection_state')
        .insert({
          ad_account_id: accountId,
          learning_mode: false,
          total_anomalies: detectionCount,
          high_severity_anomalies: highSeverityCount,
          updated_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Error updating detection_state:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Send alerts for high severity detections
 */
async function sendAlerts(account, detections) {
  try {
    // Get user preferences
    const { data: user } = await supabase
      .from('users')
      .select('email, whatsapp_number, notification_preferences')
      .eq('id', account.user_id)
      .single();
    
    if (!user) {
      return;
    }
    
    // Count high severity detections
    let highSeverityCount = 0;
    for (const ruleId in detections) {
      const ruleDetections = detections[ruleId] || [];
      highSeverityCount += ruleDetections.filter(d => d.severity === 'high').length;
    }
    
    if (highSeverityCount === 0) {
      return; // No high severity detections
    }
    
    // Create in-app notification
    await supabase
      .from('notifications')
      .insert({
        user_id: account.user_id,
        type: 'fraud_alert',
        title: `זוהו ${highSeverityCount} חריגות חמורות`,
        message: `נמצאו ${highSeverityCount} חריגות חמורות בחשבון ${account.account_name}`,
        severity: 'high',
        metadata: {
          account_id: account.id,
          account_name: account.account_name,
          detection_count: highSeverityCount
        },
        created_at: new Date().toISOString()
      });
    
    // TODO: Send email if user has email notifications enabled
    // TODO: Send WhatsApp if user has WhatsApp notifications enabled
    
    console.log(`   📧 Sent alert for ${highSeverityCount} high severity detections`);
  } catch (error) {
    console.error('Error sending alerts:', error);
    // Don't throw - alerts are not critical
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
  // Run hourly
  const schedule = '0 * * * *';
  
  console.log(`⏰ [DETECTION-JOB] Scheduled with cron: ${schedule}`);
  console.log('📅 Runs every hour');
  
  cron.schedule(schedule, async () => {
    try {
      await runDetection();
    } catch (error) {
      console.error('[DETECTION-JOB] Cron execution failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jerusalem"
  });
  
  console.log('✅ [DETECTION-JOB] Cron job is active and running');
}

/**
 * Run immediately if executed directly
 */
if (require.main === module) {
  console.log('🚀 Running detection manually...');
  runDetection()
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

module.exports = { runDetection, setupCronJob };
