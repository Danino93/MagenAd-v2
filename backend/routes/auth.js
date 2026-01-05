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
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: userInfo.email,
          full_name: userInfo.name
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

module.exports = router;