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
 * 3. שומר detections ב-detections table
 * 4. מעדכן severity levels
 * 5. שולח התראות (אם צריך)
 * 6. לוגים + error handling
 * 
 * Detection Rules:
 * ----------------
 * A1: IP Anomaly Detection
 * A2: Click Velocity Spikes
 * A3: Geographic Anomalies
 * B1: CTR Anomalies
 * B2: CPC Anomalies
 * B3: Conversion Rate Anomalies
 * C1: Time-based Patterns
 * C2: Device Distribution
 * 
 * תלויות:
 * --------
 * - node-cron
 * - DetectionEngine
 * - Supabase Client
 * 
 * הפעלה ידנית:
 * -------------
 * node backend/jobs/run-detection.js
 * 
 * ================================================
 */

const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')
const DetectionEngine = require('../services/DetectionEngine')

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * Main Detection Function
 */
async function runDetection() {
  const startTime = Date.now()
  console.log('\n🔍 [DETECTION-JOB] Starting anomaly detection...')
  console.log(`⏰ Started at: ${new Date().toISOString()}`)
  
  try {
    // 1. Get accounts ready for detection
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select(`
        id,
        user_id,
        account_id,
        account_name,
        detection_state!inner(learning_mode, baseline_established_at)
      `)
      .eq('is_active', true)
      .eq('detection_state.learning_mode', false) // Only accounts with established baseline
      .order('created_at', { ascending: true })
    
    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`)
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('⚠️  No accounts ready for detection (all in learning mode)')
      return
    }
    
    console.log(`🎯 Found ${accounts.length} accounts ready for detection`)
    
    // 2. Process each account
    let successCount = 0
    let failCount = 0
    let totalDetections = 0
    let highSeverityCount = 0
    
    for (const account of accounts) {
      try {
        console.log(`\n🔍 Analyzing account: ${account.account_name} (${account.account_id})`)
        
        // 3. Run detection engine
        console.log('   ⚙️  Running detection engine...')
        
        const detectionResult = await DetectionEngine.runDetection(
          account.user_id,
          account.account_id
        )
        
        if (!detectionResult || !detectionResult.detections) {
          console.log('   ℹ️  No detections returned')
          continue
        }
        
        const { detections, summary } = detectionResult
        
        console.log(`   📊 Found ${detections.length} anomalies`)
        
        if (detections.length === 0) {
          console.log('   ✅ No anomalies detected - account looks clean!')
          successCount++
          continue
        }
        
        // 4. Categorize by severity
        const bySeverity = {
          high: detections.filter(d => d.severity === 'high').length,
          medium: detections.filter(d => d.severity === 'medium').length,
          low: detections.filter(d => d.severity === 'low').length
        }
        
        console.log(`   🔴 High: ${bySeverity.high}`)
        console.log(`   🟡 Medium: ${bySeverity.medium}`)
        console.log(`   🟢 Low: ${bySeverity.low}`)
        
        // 5. Save detections to database
        const detectionsToInsert = detections.map(detection => ({
          user_id: account.user_id,
          account_id: account.account_id,
          rule_id: detection.rule_id,
          rule_name: detection.rule_name,
          severity: detection.severity,
          confidence: detection.confidence,
          anomaly_score: detection.anomaly_score,
          description: detection.description,
          affected_entities: detection.affected_entities,
          evidence: detection.evidence,
          recommended_actions: detection.recommended_actions,
          estimated_impact: detection.estimated_impact,
          detected_at: new Date().toISOString(),
          status: 'new'
        }))
        
        const { error: insertError } = await supabase
          .from('detections')
          .insert(detectionsToInsert)
        
        if (insertError) {
          console.error(`   ❌ Failed to save detections: ${insertError.message}`)
          failCount++
          continue
        }
        
        console.log(`   ✅ Saved ${detections.length} detections to database`)
        
        // 6. Update detection state
        await supabase
          .from('detection_state')
          .update({
            last_detection_run: new Date().toISOString(),
            total_detections: supabase.raw('total_detections + ?', [detections.length]),
            high_severity_count: supabase.raw('high_severity_count + ?', [bySeverity.high]),
            updated_at: new Date().toISOString()
          })
          .eq('account_id', account.account_id)
        
        // 7. Send alerts for high severity
        if (bySeverity.high > 0) {
          console.log(`   🚨 Sending alerts for ${bySeverity.high} high-severity detections...`)
          
          await sendAlerts(account, detections.filter(d => d.severity === 'high'))
          highSeverityCount += bySeverity.high
        }
        
        successCount++
        totalDetections += detections.length
        console.log(`   ✅ Detection completed successfully`)
        
      } catch (accountError) {
        console.error(`   ❌ Error processing account ${account.account_name}:`, accountError.message)
        failCount++
      }
    }
    
    // 8. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('\n' + '='.repeat(60))
    console.log('🔍 DETECTION SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Successful: ${successCount}/${accounts.length} accounts`)
    console.log(`❌ Failed: ${failCount}/${accounts.length} accounts`)
    console.log(`📈 Total detections: ${totalDetections}`)
    console.log(`🚨 High severity: ${highSeverityCount}`)
    console.log(`⏱️  Duration: ${duration}s`)
    console.log(`⏰ Completed at: ${new Date().toISOString()}`)
    console.log('='.repeat(60) + '\n')
    
    // 9. Log to database
    await logJobExecution('run-detection', {
      accounts_processed: accounts.length,
      successful: successCount,
      failed: failCount,
      total_detections: totalDetections,
      high_severity: highSeverityCount,
      duration_seconds: parseFloat(duration)
    })
    
  } catch (error) {
    console.error('\n❌ [DETECTION-JOB] Fatal error:', error)
    
    await logJobExecution('run-detection', {
      error: error.message,
      stack: error.stack
    }, 'failed')
    
    throw error
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
      .single()
    
    if (!user) {
      console.log('   ⚠️  User not found for alerts')
      return
    }
    
    const preferences = user.notification_preferences || {}
    
    // Email alerts
    if (preferences.email_alerts !== false) {
      console.log(`   📧 Sending email alert to ${user.email}`)
      
      // TODO: Implement email service
      // await EmailService.sendAnomalyAlert(user.email, account, detections)
    }
    
    // In-app notifications
    const notifications = detections.map(detection => ({
      user_id: account.user_id,
      type: 'anomaly_detected',
      title: `🚨 ${detection.rule_name}`,
      message: detection.description,
      severity: detection.severity,
      data: {
        account_id: account.account_id,
        account_name: account.account_name,
        detection_id: detection.id,
        rule_id: detection.rule_id
      },
      read: false,
      created_at: new Date().toISOString()
    }))
    
    await supabase
      .from('notifications')
      .insert(notifications)
    
    console.log(`   ✅ Created ${notifications.length} in-app notifications`)
    
    // WhatsApp alerts (if configured)
    if (preferences.whatsapp_alerts && preferences.whatsapp_number) {
      console.log(`   📱 Sending WhatsApp alert to ${preferences.whatsapp_number}`)
      
      // TODO: Implement WhatsApp service
      // await WhatsAppService.sendAnomalyAlert(preferences.whatsapp_number, account, detections)
    }
    
  } catch (error) {
    console.error('   ❌ Failed to send alerts:', error.message)
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
      })
  } catch (error) {
    console.error('Failed to log job execution:', error.message)
  }
}

/**
 * Setup Cron Job
 */
function setupCronJob() {
  // Run every hour at minute 0
  const schedule = '0 * * * *'
  
  console.log(`⏰ [DETECTION-JOB] Scheduled with cron: ${schedule}`)
  console.log('📅 Runs hourly (every hour at :00)')
  
  cron.schedule(schedule, async () => {
    try {
      await runDetection()
    } catch (error) {
      console.error('[DETECTION-JOB] Cron execution failed:', error)
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jerusalem" // Israel timezone
  })
  
  console.log('✅ [DETECTION-JOB] Cron job is active and running')
}

/**
 * Run immediately if executed directly
 */
if (require.main === module) {
  console.log('🚀 Running detection engine manually...')
  runDetection()
    .then(() => {
      console.log('✅ Manual execution completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Manual execution failed:', error)
      process.exit(1)
    })
} else {
  // Setup cron when required as module
  setupCronJob()
}

module.exports = { runDetection, setupCronJob }
