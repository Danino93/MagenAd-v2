/*
 * Environment Variables Validation
 * ---------------------------------
 * אימות משתני סביבה בהפעלה
 */

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
]

function validateEnv() {
  const missing = []
  
  for (const envVar of requiredEnvVars) {
    // Check both with and without prefix
    if (!process.env[envVar] && !process.env[`GOOGLE_ADS_${envVar}`]) {
      // Check alternative names
      if (envVar === 'GOOGLE_CLIENT_ID' && process.env.GOOGLE_ADS_CLIENT_ID) continue
      if (envVar === 'GOOGLE_CLIENT_SECRET' && process.env.GOOGLE_ADS_CLIENT_SECRET) continue
      if (envVar === 'SUPABASE_SERVICE_KEY' && process.env.SUPABASE_SERVICE_ROLE_KEY) continue
      
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(v => console.error(`   - ${v}`))
    console.error('⚠️  Server will continue but some features may not work')
    // Don't exit in development - just warn
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  } else {
    console.log('✅ All required environment variables are set')
  }
}

module.exports = { validateEnv }
