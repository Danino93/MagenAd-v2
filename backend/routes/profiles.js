/*
 * profiles.js (routes)
 * 
 * Routes לניהול Profiles - MagenAd V2
 * 
 * תפקיד:
 * - יצירת/עדכון/קבלת profiles
 * - Profile types: easy, normal, aggressive
 * - Custom thresholds
 * 
 * Endpoints:
 * - GET /api/profiles/:adAccountId - קבלת profile
 * - POST /api/profiles/:adAccountId - יצירת profile
 * - PUT /api/profiles/:adAccountId - עדכון profile
 */

const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware: Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = {
      id: decoded.userId || decoded.id || decoded.user_id,
      email: decoded.email
    };
    next();
  });
};

// Profile presets
const PROFILE_PRESETS = {
  easy: {
    profile_type: 'easy',
    custom_thresholds: {
      frequency: {
        rapid_repeat_clicks: 4,
        rapid_repeat_window_minutes: 2,
        short_window_clicks: 6,
        short_window_minutes: 10
      },
      burst: {
        account_spike_multiplier: 2.5,
        campaign_spike_multiplier: 2.8
      },
      cooldown_hours: 24
    },
    business_hours_start: 8,
    business_hours_end: 18,
    business_days: ['1', '2', '3', '4', '5'],
    timezone: 'Asia/Jerusalem'
  },
  normal: {
    profile_type: 'normal',
    custom_thresholds: {
      frequency: {
        rapid_repeat_clicks: 3,
        rapid_repeat_window_minutes: 2,
        short_window_clicks: 5,
        short_window_minutes: 10
      },
      burst: {
        account_spike_multiplier: 2.0,
        campaign_spike_multiplier: 2.3
      },
      cooldown_hours: 12
    },
    business_hours_start: 8,
    business_hours_end: 18,
    business_days: ['1', '2', '3', '4', '5'],
    timezone: 'Asia/Jerusalem'
  },
  aggressive: {
    profile_type: 'aggressive',
    custom_thresholds: {
      frequency: {
        rapid_repeat_clicks: 2,
        rapid_repeat_window_minutes: 2,
        short_window_clicks: 3,
        short_window_minutes: 10
      },
      burst: {
        account_spike_multiplier: 1.7,
        campaign_spike_multiplier: 2.0
      },
      cooldown_hours: 6
    },
    business_hours_start: 8,
    business_hours_end: 18,
    business_days: ['1', '2', '3', '4', '5'],
    timezone: 'Asia/Jerusalem'
  }
};

// GET /api/profiles/:adAccountId - קבלת profile
router.get('/:adAccountId', authenticateToken, async (req, res) => {
  try {
    const { adAccountId } = req.params;

    // בדוק שהחשבון שייך למשתמש
    const { data: account, error: accountError } = await supabase
      .from('ad_accounts')
      .select('id, user_id')
      .eq('id', adAccountId)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // קבל profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('ad_account_id', adAccountId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // אם אין profile, החזר default
    if (!profile) {
      return res.json({
        profile: null,
        default: PROFILE_PRESETS.normal
      });
    }

    res.json({ profile });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// POST /api/profiles/:adAccountId - יצירת profile
router.post('/:adAccountId', authenticateToken, async (req, res) => {
  try {
    const { adAccountId } = req.params;
    const { profile_type, custom_thresholds, business_hours_start, business_hours_end, business_days, timezone } = req.body;

    // בדוק שהחשבון שייך למשתמש
    const { data: account, error: accountError } = await supabase
      .from('ad_accounts')
      .select('id, user_id')
      .eq('id', adAccountId)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // בדוק אם כבר יש profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('ad_account_id', adAccountId)
      .single();

    if (existingProfile) {
      return res.status(409).json({ error: 'Profile already exists. Use PUT to update.' });
    }

    // אם נשלח profile_type preset, השתמש בו
    let profileData;
    if (profile_type && PROFILE_PRESETS[profile_type]) {
      profileData = {
        ...PROFILE_PRESETS[profile_type],
        ad_account_id: adAccountId
      };
      // אפשר override עם custom_thresholds אם נשלח
      if (custom_thresholds) {
        profileData.custom_thresholds = {
          ...profileData.custom_thresholds,
          ...custom_thresholds
        };
      }
    } else {
      // יצירה ידנית
      profileData = {
        ad_account_id: adAccountId,
        profile_type: profile_type || 'normal',
        custom_thresholds: custom_thresholds || {},
        business_hours_start: business_hours_start || 8,
        business_hours_end: business_hours_end || 18,
        business_days: business_days || ['1', '2', '3', '4', '5'],
        timezone: timezone || 'Asia/Jerusalem'
      };
    }

    // צור profile
    const { data: profile, error: createError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (createError) throw createError;

    res.status(201).json({ profile });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// PUT /api/profiles/:adAccountId - עדכון profile
router.put('/:adAccountId', authenticateToken, async (req, res) => {
  try {
    const { adAccountId } = req.params;
    const { profile_type, custom_thresholds, business_hours_start, business_hours_end, business_days, timezone } = req.body;

    // בדוק שהחשבון שייך למשתמש
    const { data: account, error: accountError } = await supabase
      .from('ad_accounts')
      .select('id, user_id')
      .eq('id', adAccountId)
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // בדוק אם יש profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('ad_account_id', adAccountId)
      .single();

    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found. Use POST to create.' });
    }

    // בנה update data
    const updateData = {};
    if (profile_type !== undefined) updateData.profile_type = profile_type;
    if (custom_thresholds !== undefined) {
      updateData.custom_thresholds = {
        ...existingProfile.custom_thresholds,
        ...custom_thresholds
      };
    }
    if (business_hours_start !== undefined) updateData.business_hours_start = business_hours_start;
    if (business_hours_end !== undefined) updateData.business_hours_end = business_hours_end;
    if (business_days !== undefined) updateData.business_days = business_days;
    if (timezone !== undefined) updateData.timezone = timezone;

    // אם נשלח profile_type preset, עדכן את כל הערכים
    if (profile_type && PROFILE_PRESETS[profile_type]) {
      Object.assign(updateData, PROFILE_PRESETS[profile_type]);
      updateData.ad_account_id = adAccountId; // לא צריך לעדכן את זה
      delete updateData.ad_account_id; // אבל נמחק אותו
    }

    // עדכן profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('ad_account_id', adAccountId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
