-- =====================================================
-- MagenAd V2 - Ultimate Database Schema
-- =====================================================
-- 24 טבלאות מלאות - כל מה שצריך עכשיו ובעתיד!
-- תריץ פעם אחת - ותהיה רגוע לתמיד! 💪
-- =====================================================

-- =====================================================
-- PHASE 1: CORE TABLES (10)
-- =====================================================

-- 1. users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. ad_accounts
CREATE TABLE IF NOT EXISTS public.ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  google_customer_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  currency TEXT DEFAULT 'ILS',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, google_customer_id)
);

CREATE INDEX idx_ad_accounts_user_id ON public.ad_accounts(user_id);
CREATE INDEX idx_ad_accounts_google_id ON public.ad_accounts(google_customer_id);
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ad accounts" ON public.ad_accounts FOR ALL USING (auth.uid() = user_id);

-- 3. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  profile_type TEXT DEFAULT 'normal' CHECK (profile_type IN ('easy', 'normal', 'aggressive')),
  custom_thresholds JSONB DEFAULT '{}'::jsonb,
  business_hours_start INTEGER DEFAULT 8,
  business_hours_end INTEGER DEFAULT 18,
  business_days TEXT[] DEFAULT ARRAY['1','2','3','4','5'],
  timezone TEXT DEFAULT 'Asia/Jerusalem',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id)
);

CREATE INDEX idx_profiles_account ON public.profiles(ad_account_id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage profiles through ad_accounts" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.ad_accounts WHERE ad_accounts.id = profiles.ad_account_id AND ad_accounts.user_id = auth.uid())
);

-- 4. raw_events
CREATE TABLE IF NOT EXISTS public.raw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  ad_group_id TEXT,
  ad_group_name TEXT,
  gclid TEXT,
  click_timestamp TIMESTAMPTZ NOT NULL,
  device TEXT,
  network TEXT,
  country_code TEXT,
  cost_micros BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id, campaign_id, gclid, click_timestamp)
);

CREATE INDEX idx_raw_events_account ON public.raw_events(ad_account_id);
CREATE INDEX idx_raw_events_timestamp ON public.raw_events(click_timestamp DESC);
CREATE INDEX idx_raw_events_campaign ON public.raw_events(campaign_id);
CREATE INDEX idx_raw_events_device ON public.raw_events(device);
CREATE INDEX idx_raw_events_network ON public.raw_events(network);
ALTER TABLE public.raw_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read events through ad_accounts" ON public.raw_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ad_accounts WHERE ad_accounts.id = raw_events.ad_account_id AND ad_accounts.user_id = auth.uid())
);

-- 5. baseline_stats
CREATE TABLE IF NOT EXISTS public.baseline_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  clicks_per_day NUMERIC DEFAULT 0,
  device_mobile_pct NUMERIC DEFAULT 0,
  device_desktop_pct NUMERIC DEFAULT 0,
  device_tablet_pct NUMERIC DEFAULT 0,
  network_search_pct NUMERIC DEFAULT 0,
  network_display_pct NUMERIC DEFAULT 0,
  network_youtube_pct NUMERIC DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id, source_key, period_start, period_end)
);

CREATE INDEX idx_baseline_account ON public.baseline_stats(ad_account_id);
CREATE INDEX idx_baseline_source_key ON public.baseline_stats(source_key);
CREATE INDEX idx_baseline_calculated ON public.baseline_stats(calculated_at DESC);
ALTER TABLE public.baseline_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read baseline through ad_accounts" ON public.baseline_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ad_accounts WHERE ad_accounts.id = baseline_stats.ad_account_id AND ad_accounts.user_id = auth.uid())
);

-- 6. detection_state
CREATE TABLE IF NOT EXISTS public.detection_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  is_learning BOOLEAN DEFAULT true,
  learning_started_at TIMESTAMPTZ DEFAULT NOW(),
  learning_days_required INTEGER DEFAULT 7,
  learning_events_required INTEGER DEFAULT 100,
  learning_days_elapsed INTEGER DEFAULT 0,
  learning_events_count INTEGER DEFAULT 0,
  detection_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id)
);

CREATE INDEX idx_detection_state_account ON public.detection_state(ad_account_id);
CREATE INDEX idx_detection_state_learning ON public.detection_state(is_learning);
ALTER TABLE public.detection_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read detection state through ad_accounts" ON public.detection_state FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ad_accounts WHERE ad_accounts.id = detection_state.ad_account_id AND ad_accounts.user_id = auth.uid())
);

-- 7. detections
CREATE TABLE IF NOT EXISTS public.detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  source_key TEXT NOT NULL,
  campaign_id TEXT,
  campaign_name TEXT,
  evidence JSONB NOT NULL,
  suspicious_clicks INTEGER DEFAULT 0,
  estimated_wasted_cost NUMERIC DEFAULT 0,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  detection_period_start TIMESTAMPTZ,
  detection_period_end TIMESTAMPTZ,
  action_taken TEXT,
  action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_detections_account ON public.detections(ad_account_id);
CREATE INDEX idx_detections_rule ON public.detections(rule_code);
CREATE INDEX idx_detections_severity ON public.detections(severity);
CREATE INDEX idx_detections_detected_at ON public.detections(detected_at DESC);
CREATE INDEX idx_detections_source_key ON public.detections(source_key);
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read detections through ad_accounts" ON public.detections FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ad_accounts WHERE ad_accounts.id = detections.ad_account_id AND ad_accounts.user_id = auth.uid())
);

-- 8. cooldown_tracker
CREATE TABLE IF NOT EXISTS public.cooldown_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  source_key TEXT NOT NULL,
  cooldown_until TIMESTAMPTZ NOT NULL,
  original_detection_id UUID REFERENCES public.detections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id, rule_code, source_key)
);

CREATE INDEX idx_cooldown_account ON public.cooldown_tracker(ad_account_id);
CREATE INDEX idx_cooldown_until ON public.cooldown_tracker(cooldown_until);
CREATE INDEX idx_cooldown_rule_source ON public.cooldown_tracker(rule_code, source_key);
ALTER TABLE public.cooldown_tracker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read cooldown through ad_accounts" ON public.cooldown_tracker FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ad_accounts WHERE ad_accounts.id = cooldown_tracker.ad_account_id AND ad_accounts.user_id = auth.uid())
);

-- 9. monthly_reports
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  report_month INTEGER NOT NULL,
  report_year INTEGER NOT NULL,
  total_clicks INTEGER DEFAULT 0,
  total_detections INTEGER DEFAULT 0,
  total_actions_taken INTEGER DEFAULT 0,
  estimated_saved_amount NUMERIC DEFAULT 0,
  quiet_index INTEGER DEFAULT 100,
  quiet_status TEXT,
  top_campaigns_suspicious JSONB,
  high_severity_count INTEGER DEFAULT 0,
  medium_severity_count INTEGER DEFAULT 0,
  low_severity_count INTEGER DEFAULT 0,
  whatsapp_sent BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id, report_year, report_month)
);

CREATE INDEX idx_monthly_reports_account ON public.monthly_reports(ad_account_id);
CREATE INDEX idx_monthly_reports_period ON public.monthly_reports(report_year DESC, report_month DESC);
CREATE INDEX idx_monthly_reports_whatsapp ON public.monthly_reports(whatsapp_sent, whatsapp_sent_at);
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read reports through ad_accounts" ON public.monthly_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ad_accounts WHERE ad_accounts.id = monthly_reports.ad_account_id AND ad_accounts.user_id = auth.uid())
);

-- 10. jobs_log
CREATE TABLE IF NOT EXISTS public.jobs_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('started', 'success', 'error')),
  message TEXT,
  details JSONB,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_log_name ON public.jobs_log(job_name);
CREATE INDEX idx_jobs_log_status ON public.jobs_log(status);
CREATE INDEX idx_jobs_log_started ON public.jobs_log(started_at DESC);
CREATE INDEX idx_jobs_log_account ON public.jobs_log(ad_account_id);
ALTER TABLE public.jobs_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only authenticated users can read jobs log" ON public.jobs_log FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- PHASE 2: CRITICAL ADDITIONS (4)
-- =====================================================

-- 11. detection_rules
-- כללי זיהוי דינמיים - ניתן לשנות בלי לשנות קוד!
CREATE TABLE IF NOT EXISTS public.detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code TEXT NOT NULL UNIQUE, -- A1, A2, B1...
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  category TEXT NOT NULL, -- 'spike', 'pattern', 'behavior', 'quality'
  
  -- Thresholds per profile
  threshold_easy JSONB NOT NULL,
  threshold_normal JSONB NOT NULL,
  threshold_aggressive JSONB NOT NULL,
  
  -- Cooldown
  cooldown_hours INTEGER DEFAULT 24,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_detection_rules_code ON public.detection_rules(rule_code);
CREATE INDEX idx_detection_rules_active ON public.detection_rules(is_active);
CREATE INDEX idx_detection_rules_category ON public.detection_rules(category);

-- 12. user_notifications
-- הגדרות התראות לכל משתמש
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Channels
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_number TEXT,
  
  -- Frequency
  immediate_alerts BOOLEAN DEFAULT true, -- high severity
  daily_digest BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT false,
  monthly_report BOOLEAN DEFAULT true,
  
  -- Alert Filters
  min_severity TEXT DEFAULT 'medium' CHECK (min_severity IN ('high', 'medium', 'low')),
  alert_categories TEXT[] DEFAULT ARRAY['spike', 'pattern', 'behavior', 'quality'],
  
  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start INTEGER, -- 22 (10 PM)
  quiet_hours_end INTEGER,   -- 8 (8 AM)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id);
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON public.user_notifications FOR ALL USING (auth.uid() = user_id);

-- 13. notification_queue
-- תור הודעות שממתינות לשליחה
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  
  -- Notification Type
  notification_type TEXT NOT NULL, -- 'detection_alert', 'monthly_report', 'daily_digest'
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  
  -- Content
  subject TEXT,
  body TEXT NOT NULL,
  data JSONB, -- extra data for templates
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5, -- 1-10 (10 = highest)
  
  -- Attempts
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_user ON public.notification_queue(user_id);
CREATE INDEX idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled ON public.notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_channel ON public.notification_queue(channel);
CREATE INDEX idx_notification_queue_priority ON public.notification_queue(priority DESC);
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON public.notification_queue FOR SELECT USING (auth.uid() = user_id);

-- 14. subscriptions
-- תוכניות מנוי
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Plan
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'starter', 'pro', 'business')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  
  -- Pricing
  price_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'ILS',
  
  -- Limits
  max_ad_accounts INTEGER DEFAULT 1,
  max_clicks_per_month INTEGER, -- NULL = unlimited
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  
  -- Trial
  trial_ends_at TIMESTAMPTZ,
  
  -- Billing
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  
  -- Payment
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON public.subscriptions(plan_type);
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions(current_period_end);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- PHASE 3: BUSINESS TABLES (5)
-- =====================================================

-- 15. invoices
-- חשבוניות
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  
  -- Invoice Details
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal NUMERIC NOT NULL,
  tax NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ILS',
  
  -- Line Items
  line_items JSONB NOT NULL, -- [{description, quantity, unit_price, total}]
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  paid_at TIMESTAMPTZ,
  
  -- Payment
  payment_method TEXT,
  stripe_invoice_id TEXT,
  
  -- PDF
  pdf_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON public.invoices(user_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);

-- 16. payment_methods
-- אמצעי תשלום
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Card Details (מוצפן!)
  card_brand TEXT, -- visa, mastercard, amex
  card_last4 TEXT NOT NULL,
  card_exp_month INTEGER NOT NULL,
  card_exp_year INTEGER NOT NULL,
  
  -- Stripe
  stripe_payment_method_id TEXT NOT NULL,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_user ON public.payment_methods(user_id);
CREATE INDEX idx_payment_methods_default ON public.payment_methods(is_default);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own payment methods" ON public.payment_methods FOR ALL USING (auth.uid() = user_id);

-- 17. usage_tracking
-- מעקב שימוש חודשי
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Period
  tracking_month INTEGER NOT NULL,
  tracking_year INTEGER NOT NULL,
  
  -- Usage Metrics
  clicks_processed INTEGER DEFAULT 0,
  detections_created INTEGER DEFAULT 0,
  reports_generated INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  
  -- Limits
  clicks_limit INTEGER,
  clicks_overage INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tracking_year, tracking_month)
);

CREATE INDEX idx_usage_tracking_user ON public.usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON public.usage_tracking(tracking_year DESC, tracking_month DESC);
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own usage" ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);

-- 18. user_overrides
-- ביטולים ידניים של detection
CREATE TABLE IF NOT EXISTS public.user_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  detection_id UUID NOT NULL REFERENCES public.detections(id) ON DELETE CASCADE,
  
  -- Override Type
  override_type TEXT NOT NULL CHECK (override_type IN ('false_positive', 'ignored', 'whitelisted')),
  
  -- Reason
  reason TEXT,
  notes TEXT,
  
  -- Whitelist (if applicable)
  whitelist_source_key TEXT,
  whitelist_until TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(detection_id)
);

CREATE INDEX idx_user_overrides_user ON public.user_overrides(user_id);
CREATE INDEX idx_user_overrides_detection ON public.user_overrides(detection_id);
CREATE INDEX idx_user_overrides_type ON public.user_overrides(override_type);
ALTER TABLE public.user_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own overrides" ON public.user_overrides FOR ALL USING (auth.uid() = user_id);

-- 19. audit_log
-- מעקב אחרי שינויים קריטיים
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Action
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  resource_type TEXT NOT NULL, -- 'ad_account', 'detection', 'subscription'
  resource_id UUID,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_resource ON public.audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own audit logs" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- PHASE 4: GROWTH TABLES (5)
-- =====================================================

-- 20. waitlist
-- רשימת המתנה (לפני launch)
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact Info
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  company TEXT,
  phone TEXT,
  
  -- Source
  referral_code TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'converted', 'declined')),
  invited_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- Priority
  priority INTEGER DEFAULT 5, -- 1-10
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_waitlist_email ON public.waitlist(email);
CREATE INDEX idx_waitlist_status ON public.waitlist(status);
CREATE INDEX idx_waitlist_created ON public.waitlist(created_at DESC);
CREATE INDEX idx_waitlist_referral ON public.waitlist(referral_code);

-- 21. referrals
-- תוכנית הפניות
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Referral Code
  referral_code TEXT NOT NULL UNIQUE,
  
  -- Referred User
  referred_email TEXT,
  referred_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'rewarded')),
  signed_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  -- Reward
  reward_type TEXT, -- 'free_month', 'discount', 'credit'
  reward_amount NUMERIC,
  reward_granted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_status ON public.referrals(status);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_user_id);

-- 22. support_tickets
-- פניות תמיכה
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Ticket Details
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Category
  category TEXT CHECK (category IN ('technical', 'billing', 'feature_request', 'bug', 'other')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  
  -- Assignment
  assigned_to UUID, -- admin user
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_number ON public.support_tickets(ticket_number);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_support_tickets_created ON public.support_tickets(created_at DESC);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id);

-- 23. email_campaigns
-- קמפיינים שיווקיים
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campaign Details
  campaign_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Targeting
  target_segment TEXT, -- 'all', 'free_users', 'paid_users', 'churned_users'
  target_filters JSONB,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  
  -- Stats
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_scheduled ON public.email_campaigns(scheduled_for);
CREATE INDEX idx_email_campaigns_created ON public.email_campaigns(created_at DESC);

-- 24. aggregated_stats
-- סטטיסטיקות מצטברות (לביצועים)
CREATE TABLE IF NOT EXISTS public.aggregated_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES public.ad_accounts(id) ON DELETE CASCADE,
  
  -- Period
  stat_date DATE NOT NULL,
  stat_hour INTEGER, -- 0-23 (NULL = daily aggregate)
  
  -- Metrics
  total_clicks INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  suspicious_clicks INTEGER DEFAULT 0,
  detections_count INTEGER DEFAULT 0,
  
  -- Device Breakdown
  clicks_mobile INTEGER DEFAULT 0,
  clicks_desktop INTEGER DEFAULT 0,
  clicks_tablet INTEGER DEFAULT 0,
  
  -- Network Breakdown
  clicks_search INTEGER DEFAULT 0,
  clicks_display INTEGER DEFAULT 0,
  clicks_youtube INTEGER DEFAULT 0,
  
  -- Top Campaigns
  top_campaigns JSONB, -- [{campaign_id, clicks, cost}, ...]
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ad_account_id, stat_date, stat_hour)
);

CREATE INDEX idx_aggregated_stats_account ON public.aggregated_stats(ad_account_id);
CREATE INDEX idx_aggregated_stats_date ON public.aggregated_stats(stat_date DESC);
CREATE INDEX idx_aggregated_stats_hour ON public.aggregated_stats(stat_hour);
ALTER TABLE public.aggregated_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read stats through ad_accounts" ON public.aggregated_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ad_accounts WHERE ad_accounts.id = aggregated_stats.ad_account_id AND ad_accounts.user_id = auth.uid())
);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ad_accounts_updated_at BEFORE UPDATE ON public.ad_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_baseline_stats_updated_at BEFORE UPDATE ON public.baseline_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_detection_state_updated_at BEFORE UPDATE ON public.detection_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_detection_rules_updated_at BEFORE UPDATE ON public.detection_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_notifications_updated_at BEFORE UPDATE ON public.user_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_queue_updated_at BEFORE UPDATE ON public.notification_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON public.usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON public.waitlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aggregated_stats_updated_at BEFORE UPDATE ON public.aggregated_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🎉 הכל מוכן! 24 טבלאות מלאות!
-- =====================================================
-- עכשיו אתה יכול לישון בשקט! 😴
-- הכל מכוסה - עכשיו ובעתיד!
-- =====================================================
