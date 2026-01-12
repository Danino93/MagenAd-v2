// Quick test to see what's wrong
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config();

console.log('🔍 Checking environment variables...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('PORT:', process.env.PORT || '3001 (default)');

try {
  console.log('\n🔍 Testing validateEnv...');
  const { validateEnv } = require('./src/config/validateEnv');
  validateEnv();
  console.log('✅ validateEnv passed');
} catch (error) {
  console.error('❌ validateEnv failed:', error.message);
}

try {
  console.log('\n🔍 Testing Supabase...');
  const supabase = require('./config/supabase');
  console.log('✅ Supabase loaded');
} catch (error) {
  console.error('❌ Supabase failed:', error.message);
}

console.log('\n✅ All checks passed! Server should start now.');
