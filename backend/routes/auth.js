/*
 * auth.js (routes)
 * 
 * Routes לאימות משתמשים - MagenAd V2
 * 
 * תפקיד:
 * - אימות משתמשים דרך Google OAuth 2.0
 * - יצירת JWT tokens
 * - ניהול סשן משתמש
 * - קבלת פרטי משתמש מאומת
 * 
 * Endpoints:
 * - GET /api/auth/google - התחלת OAuth flow (redirect ל-Google)
 * - GET /api/auth/google/callback - Callback מ-Google OAuth
 * - GET /api/auth/me - קבלת פרטי משתמש מאומת
 * - POST /api/auth/logout - התנתקות
 * 
 * OAuth Flow:
 * 1. משתמש לוחץ "התחבר עם Google"
 * 2. GET /api/auth/google → redirect ל-Google
 * 3. משתמש מאשר ב-Google
 * 4. Google redirect ל-/api/auth/google/callback?code=...
 * 5. Backend מחליף code ב-access token
 * 6. Backend יוצר משתמש ב-Supabase (אם לא קיים)
 * 7. Backend יוצר JWT token
 * 8. Redirect ל-frontend עם token
 * 
 * Environment Variables:
 * - GOOGLE_CLIENT_ID: Google OAuth Client ID
 * - GOOGLE_CLIENT_SECRET: Google OAuth Client Secret
 * - GOOGLE_REDIRECT_URI: Redirect URI (http://localhost:3001/api/auth/google/callback)
 * - JWT_SECRET: Secret ליצירת JWT tokens
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config(); // Fallback to .env

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// GET /api/auth/google - התחל OAuth flow
router.get('/google', (req, res) => {
  // בדיקה שהמשתנים קיימים
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    console.error('❌ Missing Google OAuth config:', {
      hasClientId: !!GOOGLE_CLIENT_ID,
      hasClientSecret: !!GOOGLE_CLIENT_SECRET,
      hasRedirectUri: !!GOOGLE_REDIRECT_URI
    });
    return res.status(500).json({ 
      error: 'Google OAuth not configured properly',
      details: 'Missing required environment variables'
    });
  }

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/adwords'
  ];

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(' '))}` +
    `&access_type=offline` +
    `&prompt=consent`;

  console.log('✅ Google OAuth URL generated:', {
    redirectUri: GOOGLE_REDIRECT_URI,
    clientId: GOOGLE_CLIENT_ID.substring(0, 20) + '...'
  });

  res.json({ authUrl });
});

// GET /api/auth/google/callback - Google redirects כאן
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`http://localhost:5173/login?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const userInfo = await userInfoResponse.json();

    // Validate user info
    if (!userInfo.email) {
      console.error('❌ No email in userInfo:', userInfo);
      throw new Error('Google OAuth did not return email address');
    }

    console.log('✅ User info received:', {
      email: userInfo.email,
      name: userInfo.name
    });

    // Check if user exists in Supabase Auth
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      console.error('❌ Error searching users:', searchError);
      throw searchError;
    }
    
    let user = users?.find(u => u.email === userInfo.email);

    if (!user) {
      console.log('🔄 Creating new user in Supabase Auth...');
      // Create new user in Supabase Auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userInfo.email,
        email_confirm: true,
        user_metadata: {
          full_name: userInfo.name,
          avatar_url: userInfo.picture
        }
      });

      if (createError) throw createError;
      user = newUser.user;

      // Insert into public.users table
      // אם יש company_name ב-user_metadata, שמור אותו
      const companyName = user.user_metadata?.company_name || null;
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: userInfo.email,
          full_name: userInfo.name,
          company_name: companyName
        });

      if (insertError) throw insertError;
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user.id, 
        id: user.id, // Add both for compatibility
        email: userInfo.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/auth/callback?token=${jwtToken}`);

  } catch (error) {
    console.error('OAuth Error:', error);
    res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error.message)}`);
  }
});

// GET /api/auth/me - בדוק מי המשתמש המחובר
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error) throw error;

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /api/auth/verification-status - בדוק סטטוס אימות אימייל
router.get('/verification-status', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    // מצא את המשתמש ב-Supabase Auth
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) throw searchError;
    
    const authUser = users?.find(u => u.id === userId);
    
    if (!authUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isVerified = !!authUser.email_confirmed_at;
    const email = authUser.email;

    res.json({
      isVerified,
      email,
      verifiedAt: authUser.email_confirmed_at || null
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({ error: 'Failed to check verification status' });
  }
});

// GET /api/auth/onboarding-status - בדוק אם המשתמש סיים את ההגדרה
router.get('/onboarding-status', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    // בדוק אם יש ad_account
    const { data: adAccounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (accountsError) throw accountsError;

    const hasAdAccount = adAccounts && adAccounts.length > 0;
    let hasProfile = false;
    let adAccountId = null;

    if (hasAdAccount) {
      adAccountId = adAccounts[0].id;

      // בדוק אם יש profile
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('ad_account_id', adAccountId);

      if (profilesError) throw profilesError;
      hasProfile = profiles && profiles.length > 0;
    }

    const isOnboardingComplete = hasAdAccount && hasProfile;

    res.json({
      isOnboardingComplete,
      hasAdAccount,
      hasProfile,
      adAccountId,
      missingSteps: {
        needsAdAccount: !hasAdAccount,
        needsProfile: hasAdAccount && !hasProfile
      }
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    res.status(500).json({ error: 'Failed to check onboarding status' });
  }
});

// POST /api/auth/signup - הרשמה עם אימייל וסיסמא
router.post('/signup', async (req, res) => {
  const { email, password, full_name, phone, company_name } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required' });
  }

  try {
    // צור משתמש ב-Supabase Auth (WITHOUT email confirmation)
    // Supabase ישלח אוטומטית אימייל אימות
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // דורש אימות אימייל
      user_metadata: {
        full_name: full_name || email.split('@')[0],
        phone: phone || null,
        company_name: company_name || null
      }
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return res.status(409).json({ error: 'כתובת האימייל כבר רשומה במערכת' });
      }
      throw authError;
    }

    const user = authData.user;

    // הוסף ל-public.users table (אפילו לפני אימות - כדי לשמור את הנתונים)
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        full_name: full_name || user.user_metadata?.full_name || email.split('@')[0],
        phone: phone || null,
        company_name: company_name || null
      });

    if (insertError && !insertError.message.includes('duplicate')) {
      // אם נכשל (ולא זה duplicate), נסה למחוק את המשתמש מ-Auth
      await supabase.auth.admin.deleteUser(user.id);
      throw insertError;
    }

    // Supabase שולח אוטומטית אימייל אימות
    // לא נותנים JWT token עד שהאימייל מאומת

    res.status(201).json({
      success: true,
      message: 'החשבון נוצר בהצלחה! אנא בדקו את תיבת הדואר לאימות האימייל.',
      email: user.email,
      requiresEmailVerification: true
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'שגיאה ביצירת החשבון' });
  }
});

// GET /api/auth/verify-email - אימות אימייל דרך token
// Supabase שולח קישור אימות שמכיל token_hash ו-type
router.get('/verify-email', async (req, res) => {
  const { token_hash, type } = req.query;

  if (!token_hash || !type) {
    return res.redirect(`http://localhost:5173/login?error=invalid_verification_link`);
  }

  try {
    // יצירת client רגיל לאימות (לא admin)
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // אימות ה-token דרך Supabase
    const { data, error } = await supabaseClient.auth.verifyOtp({
      token_hash,
      type: type === 'email' ? 'email' : 'signup'
    });

    if (error) {
      console.error('Email verification error:', error);
      return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('קישור האימות לא תקין או פג תוקף')}`);
    }

    if (data.user) {
      // עדכן את המשתמש ב-public.users (אם צריך)
      await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.user.id);

      // צור JWT token אחרי אימות מוצלח
      const jwtToken = jwt.sign(
        {
          userId: data.user.id,
          id: data.user.id,
          email: data.user.email
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // מחק את האימייל הממתין
      localStorage.removeItem('pendingVerificationEmail');

      // Redirect ל-frontend עם token
      return res.redirect(`http://localhost:5173/auth/callback?token=${jwtToken}&verified=true`);
    }

    return res.redirect(`http://localhost:5173/login?error=verification_failed`);
  } catch (error) {
    console.error('Verification error:', error);
    return res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('שגיאה באימות האימייל')}`);
  }
});

// POST /api/auth/resend-verification - שליחה מחדש של אימייל אימות
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // מצא את המשתמש
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) throw searchError;
    
    const user = users?.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    if (user.email_confirmed_at) {
      return res.status(400).json({ error: 'האימייל כבר מאומת' });
    }

    // יצירת client רגיל לשליחת אימייל
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // שלח אימייל אימות מחדש
    const { error: resendError } = await supabaseClient.auth.resend({
      type: 'signup',
      email: email
    });

    if (resendError) throw resendError;

    res.json({
      success: true,
      message: 'אימייל אימות נשלח מחדש. אנא בדקו את תיבת הדואר.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: error.message || 'שגיאה בשליחת אימייל אימות' });
  }
});

// POST /api/auth/login - התחברות עם אימייל וסיסמא
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // בדוק אם המשתמש קיים ב-Supabase Auth
    const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      console.error('Error searching users:', searchError);
      throw searchError;
    }
    
    const existingUser = users?.find(u => u.email === email);
    
    if (!existingUser) {
      return res.status(401).json({ error: 'כתובת האימייל לא רשומה במערכת. אנא הירשמו תחילה.' });
    }

    // בדוק אם האימייל מאומת
    if (!existingUser.email_confirmed_at) {
      return res.status(403).json({ 
        error: 'האימייל שלכם לא מאומת. אנא בדקו את תיבת הדואר ולחצו על קישור האימות.',
        requiresVerification: true,
        email: email
      });
    }

    // התחבר דרך Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials') || 
          authError.message.includes('Email not confirmed')) {
        return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
      }
      throw authError;
    }

    const user = authData.user;

    // בדוק שוב שהאימייל מאומת (למקרה שהמצב השתנה)
    if (!user.email_confirmed_at) {
      return res.status(403).json({ 
        error: 'האימייל שלכם לא מאומת. אנא בדקו את תיבת הדואר ולחצו על קישור האימות.',
        requiresVerification: true,
        email: email
      });
    }

    // קבל פרטי משתמש מ-public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    // אם המשתמש לא קיים ב-public.users, צור אותו (לא אמור לקרות, אבל למקרה)
    if (!userData) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || email.split('@')[0],
          company_name: user.user_metadata?.company_name || null
        });

      if (insertError) throw insertError;
    }

    // צור JWT token
    const jwtToken = jwt.sign(
      {
        userId: user.id,
        id: user.id,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: userData || {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'שגיאה בהתחברות' });
  }
});

module.exports = router;