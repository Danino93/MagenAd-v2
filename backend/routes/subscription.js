/*
 * subscription.js (routes)
 * 
 * Routes לניהול מנויים - MagenAd V2
 * 
 * Endpoints:
 * - GET /api/subscription/status - קבלת סטטוס מנוי
 * - PUT /api/subscription/change-plan - שינוי תוכנית מנוי
 * - POST /api/subscription/cancel - ביטול מנוי
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

// Plan definitions
const PLANS = {
  basic: {
    name: 'Basic',
    price: 299,
    currency: 'ILS',
    max_ad_accounts: 1,
    max_clicks_per_month: 10000,
    features: ['עד 5 קמפיינים', 'זיהוי בסיסי', 'דוחות חודשיים']
  },
  pro: {
    name: 'Pro',
    price: 499,
    currency: 'ILS',
    max_ad_accounts: 5,
    max_clicks_per_month: null, // unlimited
    features: ['קמפיינים ללא הגבלה', 'זיהוי מתקדם', 'דוחות שבועיים', 'תמיכה 24/7']
  },
  enterprise: {
    name: 'Enterprise',
    price: 999,
    currency: 'ILS',
    max_ad_accounts: null, // unlimited
    max_clicks_per_month: null, // unlimited
    features: ['הכל ב-Pro', 'API Access', 'ניהול צוות', 'תמיכה ייעודית']
  }
};

// GET /api/subscription/status - קבלת סטטוס מנוי
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // אין מנוי
      return res.json({ 
        subscription: null,
        message: 'אין מנוי פעיל'
      });
    }

    if (error) throw error;

    // הוסף פרטים מהתוכנית
    const planDetails = PLANS[subscription.plan_type] || PLANS.basic;
    
    res.json({ 
      subscription: {
        ...subscription,
        plan: planDetails.name,
        price: subscription.price_amount || planDetails.price,
        billing_cycle: subscription.billing_cycle,
        status: subscription.status,
        next_billing_date: subscription.current_period_end
      }
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Helper: Check if user email is verified
const checkEmailVerified = async (userId) => {
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) return false;
    
    const authUser = users?.find(u => u.id === userId);
    return !!authUser?.email_confirmed_at;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
};

// PUT /api/subscription/change-plan - שינוי תוכנית מנוי
router.put('/change-plan', authenticateToken, async (req, res) => {
  // בדוק אם האימייל מאומת
  const isVerified = await checkEmailVerified(req.user.id);
  if (!isVerified) {
    return res.status(403).json({ 
      error: 'יש לאמת את כתובת האימייל לפני יצירת מנוי',
      requiresVerification: true
    });
  }

  try {
    const { plan_type, billing_cycle } = req.body;

    if (!plan_type || !['basic', 'pro', 'enterprise'].includes(plan_type)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const planDetails = PLANS[plan_type];
    const cycle = billing_cycle || 'monthly';

    // בדוק אם יש מנוי קיים
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    const now = new Date();
    const periodStart = new Date(now);
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (cycle === 'annual' ? 12 : 1));

    if (checkError && checkError.code === 'PGRST116') {
      // אין מנוי - צור חדש
      const { data: newSubscription, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: req.user.id,
          plan_type: plan_type,
          billing_cycle: cycle,
          price_amount: planDetails.price,
          currency: planDetails.currency,
          max_ad_accounts: planDetails.max_ad_accounts,
          max_clicks_per_month: planDetails.max_clicks_per_month,
          status: 'active',
          current_period_start: periodStart.toISOString().split('T')[0],
          current_period_end: periodEnd.toISOString().split('T')[0]
        })
        .select()
        .single();

      if (createError) throw createError;

      return res.json({ 
        success: true,
        subscription: {
          ...newSubscription,
          plan: planDetails.name,
          price: planDetails.price
        },
        message: 'מנוי נוצר בהצלחה'
      });
    }

    if (checkError) throw checkError;

    // עדכן מנוי קיים
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_type: plan_type,
        billing_cycle: cycle,
        price_amount: planDetails.price,
        currency: planDetails.currency,
        max_ad_accounts: planDetails.max_ad_accounts,
        max_clicks_per_month: planDetails.max_clicks_per_month,
        current_period_start: periodStart.toISOString().split('T')[0],
        current_period_end: periodEnd.toISOString().split('T')[0],
        cancel_at_period_end: false,
        cancelled_at: null
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ 
      success: true,
      subscription: {
        ...updatedSubscription,
        plan: planDetails.name,
        price: planDetails.price
      },
      message: 'תוכנית המנוי עודכנה בהצלחה'
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({ error: 'Failed to change plan', details: error.message });
  }
});

// POST /api/subscription/cancel - ביטול מנוי
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const { data: subscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (checkError || !subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: new Date().toISOString()
      })
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ 
      success: true,
      message: 'המנוי יבוטל בסוף התקופה הנוכחית',
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

module.exports = router;
