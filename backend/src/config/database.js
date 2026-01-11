/*
 * Database Connection Pool
 * ------------------------
 * ניהול חיבורים למסד נתונים
 */

const { createClient } = require('@supabase/supabase-js')

// Connection pool configuration
const supabaseConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'magenad-backend'
    }
  }
}

// Create client with pooling
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseConfig
)

module.exports = supabase
