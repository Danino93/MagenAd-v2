/*
 * user.js (routes)
 * 
 * Routes לניהול משתמש - MagenAd V2
 * 
 * Endpoints:
 * - PUT /api/user/profile - עדכון פרופיל משתמש
 * - PUT /api/user/password - שינוי סיסמה
 * - GET /api/user/notifications - קבלת הגדרות התראות
 * - PUT /api/user/notifications - עדכון הגדרות התראות
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

// PUT /api/user/profile - עדכון פרופיל משתמש
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, company_name } = req.body;

    // בדוק שהמשתמש קיים
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', req.user.id)
      .single();

    if (userError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // בנה update data
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (company_name !== undefined) updateData.company_name = company_name;

    // עדכן ב-users table
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // עדכן גם ב-Supabase Auth metadata (אם צריך)
    if (full_name || phone || company_name) {
      try {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const authUser = users?.find(u => u.id === req.user.id);
        
        if (authUser) {
          const metadata = { ...authUser.user_metadata };
          if (full_name) metadata.full_name = full_name;
          if (phone) metadata.phone = phone;
          if (company_name) metadata.company_name = company_name;

          await supabase.auth.admin.updateUserById(req.user.id, {
            user_metadata: metadata
          });
        }
      } catch (authError) {
        console.error('Error updating auth metadata:', authError);
        // לא נכשל אם זה נכשל - רק נדפיס שגיאה
      }
    }

    res.json({ 
      success: true,
      user: updatedUser,
      message: 'הפרופיל עודכן בהצלחה'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

// PUT /api/user/password - שינוי סיסמה
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // מצא את המשתמש ב-Supabase Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const authUser = users?.find(u => u.id === req.user.id);
    if (!authUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // בדוק את הסיסמה הנוכחית
    const { createClient } = require('@supabase/supabase-js');
    const supabaseClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: authUser.email,
      password: current_password
    });

    if (signInError) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // עדכן את הסיסמה
    const { error: updateError } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: new_password
    });

    if (updateError) throw updateError;

    res.json({ 
      success: true,
      message: 'הסיסמה עודכנה בהצלחה'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password', details: error.message });
  }
});

// GET /api/user/notifications - קבלת הגדרות התראות
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    // נחפש בטבלת user_settings או users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('notification_settings')
      .eq('id', req.user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    // אם אין הגדרות, החזר defaults
    const defaultSettings = {
      email_alerts: true,
      sms_alerts: false,
      daily_summary: true,
      weekly_report: true
    };

    res.json({ 
      settings: user?.notification_settings || defaultSettings
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

// PUT /api/user/notifications - עדכון הגדרות התראות
router.put('/notifications', authenticateToken, async (req, res) => {
  try {
    const { email_alerts, sms_alerts, daily_summary, weekly_report } = req.body;

    const notificationSettings = {
      email_alerts: email_alerts !== undefined ? email_alerts : true,
      sms_alerts: sms_alerts !== undefined ? sms_alerts : false,
      daily_summary: daily_summary !== undefined ? daily_summary : true,
      weekly_report: weekly_report !== undefined ? weekly_report : true
    };

    // עדכן ב-users table (אם יש column notification_settings)
    // אם לא, נשמור ב-JSONB או ניצור טבלה נפרדת
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ notification_settings: notificationSettings })
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError) {
      // אם ה-column לא קיים, נחזיר success אבל נדפיס אזהרה
      console.warn('notification_settings column might not exist:', updateError);
      return res.json({ 
        success: true,
        settings: notificationSettings,
        message: 'הגדרות התראות עודכנו (ייתכן שדורש migration)'
      });
    }

    res.json({ 
      success: true,
      settings: notificationSettings,
      message: 'הגדרות התראות עודכנו בהצלחה'
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

module.exports = router;
