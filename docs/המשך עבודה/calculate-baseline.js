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
 * 2. לכל חשבון - מחשב baseline stats
 * 3. שומר ב-baseline_stats table
 * 4. מעדכן detection_state.learning_mode
 * 5. מחשב Quiet Index
 * 6. לוגים + error handling
 * 
 * Baseline כולל:
 * --------------
 * - Average clicks per hour
 * - Average cost per click
 * - Geographic distribution
 * - Device distribution
 * - Time-of-day patterns
 * - Day-of-week patterns
 * 
 * תלויות:
 * --------
 * - node-cron
 * - BaselineStatsService
 * - QuietIndexService
 * - Supabase Client
 * 
 * הפעלה ידנית:
 * -------------
 * node backend/jobs/calculate-baseline.js
 * 
 * ================================================
 */

const cron = require('node-cron')
const { createClient } = require('@supabase/supabase-js')
const BaselineStatsService = require('../services/BaselineStatsService')
const QuietIndexService = require('../services/QuietIndexService')

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * Main Baseline Calculation Function
 */
async function calculateBaseline() {
  const startTime = Date.now()
  console.log('\n📊 [BASELINE-JOB] Starting baseline calculation...')
  console.log(`⏰ Started at: ${new Date().toISOString()}`)
  
  try {
    // 1. Get all active ad accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id, user_id, account_id, account_name, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    
    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`)
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('⚠️  No active accounts found')
      return
    }
    
    console.log(`📊 Found ${accounts.length} active accounts`)
    
    // 2. Process each account
    let successCount = 0
    let failCount = 0
    let totalBaselines = 0
    
    for (const account of accounts) {
      try {
        console.log(`\n📈 Processing account: ${account.account_name} (${account.account_id})`)
        
        // Check if account has enough data (at least 7 days)
        const accountAge = Date.now() - new Date(account.created_at).getTime()
        const daysOld = accountAge / (1000 * 60 * 60 * 24)
        
        console.log(`   📅 Account age: ${daysOld.toFixed(1)} days`)
        
        if (daysOld < 7) {
          console.log('   ⏳ Account too new for baseline (need 7 days)')
          continue
        }
        
        // 3. Calculate baseline using service
        console.log('   🔢 Calculating baseline statistics...')
        
        const baselineResult = await BaselineStatsService.calculateBaseline(
          account.user_id,
          account.account_id
        )
        
        if (!baselineResult || !baselineResult.baseline) {
          console.log('   ℹ️  No baseline data available')
          continue
        }
        
        const baseline = baselineResult.baseline
        console.log(`   ✅ Baseline calculated with ${baseline.sample_size} events`)
        
        // 4. Save baseline to database
        const { error: insertError } = await supabase
          .from('baseline_stats')
          .upsert({
            account_id: account.account_id,
            user_id: account.user_id,
            avg_clicks_per_hour: baseline.avg_clicks_per_hour,
            avg_cost_per_click: baseline.avg_cost_per_click,
            std_clicks_per_hour: baseline.std_clicks_per_hour,
            std_cost_per_click: baseline.std_cost_per_click,
            geographic_distribution: baseline.geographic_distribution,
            device_distribution: baseline.device_distribution,
            hour_of_day_pattern: baseline.hour_of_day_pattern,
            day_of_week_pattern: baseline.day_of_week_pattern,
            sample_size: baseline.sample_size,
            calculated_at: new Date().toISOString(),
            valid_from: baseline.period_start,
            valid_to: baseline.period_end
          }, {
            onConflict: 'account_id'
          })
        
        if (insertError) {
          console.error(`   ❌ Failed to save baseline: ${insertError.message}`)
          failCount++
          continue
        }
        
        console.log('   ✅ Baseline saved to database')
        
        // 5. Calculate Quiet Index
        console.log('   🤫 Calculating Quiet Index...')
        
        const quietIndex = await QuietIndexService.calculateQuietIndex(
          account.user_id,
          account.account_id
        )
        
        if (quietIndex) {
          console.log(`   ✅ Quiet Index: ${quietIndex.overall_score.toFixed(2)}`)
          
          // Save Quiet Index
          await supabase
            .from('quiet_index')
            .upsert({
              account_id: account.account_id,
              user_id: account.user_id,
              overall_score: quietIndex.overall_score,
              metrics: quietIndex.metrics,
              recommendations: quietIndex.recommendations,
              calculated_at: new Date().toISOString()
            }, {
              onConflict: 'account_id'
            })
        }
        
        // 6. Update detection state
        // Check if we have enough data to exit learning mode
        const shouldExitLearning = baseline.sample_size >= 1000 && daysOld >= 14
        
        if (shouldExitLearning) {
          const { data: detectionState } = await supabase
            .from('detection_state')
            .select('learning_mode')
            .eq('account_id', account.account_id)
            .single()
          
          if (detectionState?.learning_mode === true) {
            await supabase
              .from('detection_state')
              .update({
                learning_mode: false,
                baseline_established_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('account_id', account.account_id)
            
            console.log('   🎓 Account exited learning mode!')
          }
        } else {
          console.log(`   📚 Still in learning mode (need ${1000 - baseline.sample_size} more events)`)
        }
        
        successCount++
        totalBaselines++
        console.log(`   ✅ Successfully processed baseline`)
        
      } catch (accountError) {
        console.error(`   ❌ Error processing account ${account.account_name}:`, accountError.message)
        failCount++
      }
    }
    
    // 7. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('\n' + '='.repeat(60))
    console.log('📊 BASELINE CALCULATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Successful: ${successCount}/${accounts.length} accounts`)
    console.log(`❌ Failed: ${failCount}/${accounts.length} accounts`)
    console.log(`📈 Total baselines calculated: ${totalBaselines}`)
    console.log(`⏱️  Duration: ${duration}s`)
    console.log(`⏰ Completed at: ${new Date().toISOString()}`)
    console.log('='.repeat(60) + '\n')
    
    // 8. Log to database
    await logJobExecution('calculate-baseline', {
      accounts_processed: accounts.length,
      successful: successCount,
      failed: failCount,
      total_baselines: totalBaselines,
      duration_seconds: parseFloat(duration)
    })
    
  } catch (error) {
    console.error('\n❌ [BASELINE-JOB] Fatal error:', error)
    
    await logJobExecution('calculate-baseline', {
      error: error.message,
      stack: error.stack
    }, 'failed')
    
    throw error
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
  // Run daily at 2:00 AM
  const schedule = '0 2 * * *'
  
  console.log(`⏰ [BASELINE-JOB] Scheduled with cron: ${schedule}`)
  console.log('📅 Runs daily at 02:00 AM')
  
  cron.schedule(schedule, async () => {
    try {
      await calculateBaseline()
    } catch (error) {
      console.error('[BASELINE-JOB] Cron execution failed:', error)
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jerusalem" // Israel timezone
  })
  
  console.log('✅ [BASELINE-JOB] Cron job is active and running')
}

/**
 * Run immediately if executed directly
 */
if (require.main === module) {
  console.log('🚀 Running baseline calculation manually...')
  calculateBaseline()
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

module.exports = { calculateBaseline, setupCronJob }
