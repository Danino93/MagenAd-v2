/*
 * ================================================
 * Detection Engine Runner Job
 * ================================================
 * 
 * מטרה: הרצת Detection Engine לזיהוי אנומליות
 * 
 * תזמון: כל שעה
 * Schedule: '0 * * * *'
 * 
 * מה הJob עושה:
 * ---------------
 * 1. שולף חשבונות פעילים (לא ב-learning mode)
 * 2. לכל חשבון - מריץ את כל חוקי הזיהוי
 * 3. שומר detections ב-anomalies table
 * 4. מעדכן severity levels
 * 5. שולח התראות (אם צריך)
 * 6. לוגים + error handling
 * 
 * ================================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config(); // Fallback to .env

const cron = require('node-cron');
const supabase = require('../config/supabase');
const DetectionEngine = require('../services/DetectionEngine');

/**
 * Main Detection Function
 */
async function runDetection() {
  const startTime = Date.now();
  console.log('\n🔍 [DETECTION-JOB] Starting anomaly detection...');
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  try {
    // 1. Get accounts ready for detection (not in learning mode)
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
    
    // Filter accounts not in learning mode
    const accountsReady = [];
    for (const account of accounts) {
      const { data: detectionState } = await supabase
        .from('detection_state')
        .select('learning_mode')
        .eq('ad_account_id', account.id)
        .single();
      
      if (!detectionState || detectionState.learning_mode === false) {
        accountsReady.push(account);
      }
    }
    
    if (accountsReady.length === 0) {
      console.log('⚠️  No accounts ready for detection (all in learning mode)');
      return;
    }
    
    console.log(`🎯 Found ${accountsReady.length} accounts ready for detection`);
    
    // 2. Process each account
    let successCount = 0;
    let failCount = 0;
    let totalDetections = 0;
    let highSeverityCount = 0;
    
    const detectionEngine = new DetectionEngine();
    
    for (const account of accountsReady) {
      try {
        console.log(`\n🔍 Analyzing account: ${account.account_name} (${account.google_customer_id})`);
        
        // 3. Get recent clicks (last 24 hours)
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - 24);
        
        const { data: clicks, error: clicksError } = await supabase
          .from('raw_events')
          .select('*')
          .eq('ad_account_id', account.id)
          .gte('click_timestamp', startDate.toISOString())
          .limit(1000);
        
        if (clicksError) {
          throw new Error(`Failed to fetch clicks: ${clicksError.message}`);
        }
        
        if (!clicks || clicks.length === 0) {
          console.log('   ℹ️  No recent clicks to analyze');
          successCount++;
          continue;
        }
        
        console.log(`   📊 Analyzing ${clicks.length} clicks`);
        
        // 4. Run detection engine on each click
        const detections = [];
        
        for (const click of clicks) {
          try {
            const detection = await detectionEngine.detectFraud(click, account.id, 'balanced');
            
            if (detection && detection.isFraud && detection.detections) {
              for (const det of detection.detections) {
                detections.push({
                  ...det,
                  click_id: click.id,
                  click_timestamp: click.click_timestamp
                });
              }
            }
          } catch (clickError) {
            console.error(`   ⚠️  Error analyzing click ${click.id}:`, clickError.message);
          }
        }
        
        console.log(`   📊 Found ${detections.length} anomalies`);
        
        if (detections.length === 0) {
          console.log('   ✅ No anomalies detected - account looks clean!');
          successCount++;
          continue;
        }
        
        // 5. Categorize by severity
        const bySeverity = {
          high: detections.filter(d => d.severity === 'high' || d.severity_level === 'high').length,
          medium: detections.filter(d => d.severity === 'medium' || d.severity_level === 'medium').length,
          low: detections.filter(d => d.severity === 'low' || d.severity_level === 'low').length
        };
        
        console.log(`   🔴 High: ${bySeverity.high}`);
        console.log(`   🟡 Medium: ${bySeverity.medium}`);
        console.log(`   🟢 Low: ${bySeverity.low}`);
        
        // 6. Save detections to database
        const anomaliesToInsert = detections.map(detection => ({
          ad_account_id: account.id,
          user_id: account.user_id,
          click_id: detection.click_id,
          rule_id: detection.rule_id || detection.ruleId || 'unknown',
          rule_name: detection.rule_name || detection.ruleName || 'Unknown Rule',
          severity_level: detection.severity || detection.severity_level || 'medium',
          confidence_score: detection.confidence || detection.confidence_score || 0.5,
          detection_message: detection.message || detection.detection_message || 'Anomaly detected',
          detected_at: detection.click_timestamp || new Date().toISOString(),
          status: 'new',
          metadata: {
            evidence: detection.evidence,
            affected_entities: detection.affected_entities
          }
        }));
        
        const { error: insertError } = await supabase
          .from('anomalies')
          .insert(anomaliesToInsert);
        
        if (insertError) {
          console.error(`   ❌ Failed to save detections: ${insertError.message}`);
          failCount++;
          continue;
        }
        
        console.log(`   ✅ Saved ${detections.length} detections to database`);
        
        // 7. Update detection state
        await supabase
          .from('detection_state')
          .upsert({
            ad_account_id: account.id,
            user_id: account.user_id,
            last_detection_run: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'ad_account_id'
          });
        
        // 8. Send alerts for high severity
        if (bySeverity.high > 0) {
          console.log(`   🚨 Sending alerts for ${bySeverity.high} high-severity detections...`);
          
          await sendAlerts(account, detections.filter(d => 
            d.severity === 'high' || d.severity_level === 'high'
          ));
          highSeverityCount += bySeverity.high;
        }
        
        successCount++;
        totalDetections += detections.length;
        console.log(`   ✅ Detection completed successfully`);
        
      } catch (accountError) {
        console.error(`   ❌ Error processing account ${account.account_name}:`, accountError.message);
        failCount++;
      }
    }
    
    // 9. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DETECTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}/${accountsReady.length} accounts`);
    console.log(`❌ Failed: ${failCount}/${accountsReady.length} accounts`);
    console.log(`📈 Total detections: ${totalDetections}`);
    console.log(`🚨 High severity: ${highSeverityCount}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);
    console.log('='.repeat(60) + '\n');
    
    // 10. Log to database
    await logJobExecution('run-detection', {
      accounts_processed: accountsReady.length,
      successful: successCount,
      failed: failCount,
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
 * Send Alerts for High Severity Detections
 */
async function sendAlerts(account, detections) {
  try {
    // Get user notification preferences
    const { data: user } = await supabase
      .from('users')
      .select('email, notification_preferences')
      .eq('id', account.user_id)
      .single();
    
    if (!user) {
      console.log('   ⚠️  User not found for alerts');
      return;
    }
    
    // Create in-app notifications
    const notifications = detections.slice(0, 10).map(detection => ({
      user_id: account.user_id,
      type: 'anomaly_detected',
      title: `🚨 ${detection.rule_name || 'Anomaly Detected'}`,
      message: detection.message || detection.detection_message || 'High severity anomaly detected',
      severity: detection.severity || detection.severity_level || 'high',
      data: {
        account_id: account.id,
        account_name: account.account_name,
        detection_id: detection.id
      },
      read: false,
      created_at: new Date().toISOString()
    }));
    
    await supabase
      .from('notifications')
      .insert(notifications);
    
    console.log(`   ✅ Created ${notifications.length} in-app notifications`);
    
  } catch (error) {
    console.error('   ❌ Failed to send alerts:', error.message);
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
  // Run every hour at minute 0
  const schedule = '0 * * * *';
  
  console.log(`⏰ [DETECTION-JOB] Scheduled with cron: ${schedule}`);
  console.log('📅 Runs hourly (every hour at :00)');
  
  cron.schedule(schedule, async () => {
    try {
      await runDetection();
    } catch (error) {
      console.error('[DETECTION-JOB] Cron execution failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jerusalem" // Israel timezone
  });
  
  console.log('✅ [DETECTION-JOB] Cron job is active and running');
}

/**
 * Run immediately if executed directly
 */
if (require.main === module) {
  console.log('🚀 Running detection engine manually...');
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
