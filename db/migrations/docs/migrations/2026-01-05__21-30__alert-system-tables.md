# Migration: Alert System Tables (alerts / alert_rules / alert_notifications)

## תאריך
2026-01-05 21:30

## מטרה
להוסיף מערכת התראות פנימית למעקב אחר אירועים חשובים (חריגות, ניתוקים, בעיות מערכת, חריגות Quiet Index וכו׳):
- alerts: אירוע התראה שנוצר בפועל
- alert_rules: חוקים שמגדירים מתי נוצרת התראה
- alert_notifications: יומן משלוח (email/sms/webhook)

## שינוי בדאטאבייס
- יצירת טבלאות חדשות:
  - alerts
  - alert_rules
  - alert_notifications
- הוספת טריגר לעדכון updated_at ב-alert_rules
- שינוי שובר לאחור: ❌ לא

## SQL שבוצע
```sql
-- Alert System Tables
-- 3 טבלאות: alerts, alert_rules, alert_notifications

-- ========================
-- 1. alerts table
-- ========================
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- Alert Details
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  triggered_by VARCHAR(50),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(100),
  
  -- Auto-resolve
  auto_resolve BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_alerts_account ON alerts(ad_account_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_triggered ON alerts(triggered_at DESC);
CREATE INDEX idx_alerts_account_status ON alerts(ad_account_id, status);

-- ========================
-- 2. alert_rules table
-- ========================
CREATE TABLE IF NOT EXISTS alert_rules (
  id BIGSERIAL PRIMARY KEY,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- Rule Details
  rule_type VARCHAR(50) NOT NULL,
  rule_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Conditions (JSON)
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Alert Config
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  alert_title VARCHAR(255) NOT NULL,
  
  -- Notification
  notify_email BOOLEAN DEFAULT TRUE,
  notify_sms BOOLEAN DEFAULT FALSE,
  
  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  auto_resolve BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_alert_rules_account ON alert_rules(ad_account_id);
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_alert_rules_type ON alert_rules(rule_type);

-- ========================
-- 3. alert_notifications table
-- ========================
CREATE TABLE IF NOT EXISTS alert_notifications (
  id BIGSERIAL PRIMARY KEY,
  alert_id BIGINT REFERENCES alerts(id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('email', 'sms', 'webhook')),
  recipient VARCHAR(255),
  
  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_alert_notifications_alert ON alert_notifications(alert_id);
CREATE INDEX idx_alert_notifications_status ON alert_notifications(status);
CREATE INDEX idx_alert_notifications_type ON alert_notifications(notification_type);

-- ========================
-- Trigger for auto-update
-- ========================
CREATE OR REPLACE FUNCTION update_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_rules_updated_at
BEFORE UPDATE ON alert_rules
FOR EACH ROW
EXECUTE FUNCTION update_alert_rules_updated_at();

-- ========================
-- Default Alert Rules
-- ========================
-- These will be inserted when user connects account
-- (Handled by application code)

-- Comments
COMMENT ON TABLE alerts IS 'Triggered fraud alerts';
COMMENT ON TABLE alert_rules IS 'Alert rule definitions';
COMMENT ON TABLE alert_notifications IS 'Notification delivery log';



-- IP Blocking Tables
-- 2 טבלאות: ip_blacklist, ip_whitelist

-- ========================
-- 1. ip_blacklist table
-- ========================
CREATE TABLE IF NOT EXISTS ip_blacklist (
  id BIGSERIAL PRIMARY KEY,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- IP Details
  ip_address VARCHAR(45) NOT NULL,
  ip_range CIDR,  -- For CIDR blocking (future)
  
  -- Block Details
  reason TEXT NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('manual', 'auto', 'rule')),
  block_type VARCHAR(20) NOT NULL DEFAULT 'full' CHECK (block_type IN ('full', 'temporary', 'partial')),
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  -- Expiration (for temporary blocks)
  expires_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unblocked_at TIMESTAMPTZ,
  
  -- Unique constraint
  UNIQUE(ad_account_id, ip_address, status)
);

-- Indexes
CREATE INDEX idx_ip_blacklist_account ON ip_blacklist(ad_account_id);
CREATE INDEX idx_ip_blacklist_ip ON ip_blacklist(ip_address);
CREATE INDEX idx_ip_blacklist_status ON ip_blacklist(status);
CREATE INDEX idx_ip_blacklist_account_status ON ip_blacklist(ad_account_id, status);
CREATE INDEX idx_ip_blacklist_expires ON ip_blacklist(expires_at) WHERE expires_at IS NOT NULL;

-- ========================
-- 2. ip_whitelist table
-- ========================
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id BIGSERIAL PRIMARY KEY,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- IP Details
  ip_address VARCHAR(45) NOT NULL,
  ip_range CIDR,  -- For CIDR whitelisting (future)
  
  -- Whitelist Details
  reason TEXT NOT NULL,
  notes TEXT,
  
  -- Timestamp
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(ad_account_id, ip_address)
);

-- Indexes
CREATE INDEX idx_ip_whitelist_account ON ip_whitelist(ad_account_id);
CREATE INDEX idx_ip_whitelist_ip ON ip_whitelist(ip_address);
CREATE INDEX idx_ip_whitelist_account_ip ON ip_whitelist(ad_account_id, ip_address);

-- Comments
COMMENT ON TABLE ip_blacklist IS 'Blocked IP addresses - manual and auto-blocked';
COMMENT ON TABLE ip_whitelist IS 'Whitelisted IP addresses - never block these';

-- ========================
-- Function: Check if IP is blocked
-- ========================
CREATE OR REPLACE FUNCTION is_ip_blocked(
  p_account_id UUID,
  p_ip_address VARCHAR(45)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_blocked BOOLEAN;
BEGIN
  -- Check if IP is in blacklist and active
  SELECT EXISTS(
    SELECT 1 
    FROM ip_blacklist 
    WHERE ad_account_id = p_account_id 
      AND ip_address = p_ip_address 
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_blocked;
  
  RETURN v_blocked;
END;
$$ LANGUAGE plpgsql;

-- ========================
-- Function: Check if IP is whitelisted
-- ========================
CREATE OR REPLACE FUNCTION is_ip_whitelisted(
  p_account_id UUID,
  p_ip_address VARCHAR(45)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_whitelisted BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM ip_whitelist 
    WHERE ad_account_id = p_account_id 
      AND ip_address = p_ip_address
  ) INTO v_whitelisted;
  
  RETURN v_whitelisted;
END;
$$ LANGUAGE plpgsql;





----------------------אחר כך---------------


-- Reports & Dashboard Tables
-- 2 טבלאות: reports, dashboard_configs

-- ========================
-- 1. reports table
-- ========================
CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- Report Details
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('summary', 'executive', 'detailed', 'custom')),
  period VARCHAR(20) NOT NULL CHECK (period IN ('day', 'week', 'month', 'quarter', 'year', 'custom')),
  
  -- Date Range
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Report Data (JSON)
  data JSONB NOT NULL,
  
  -- File Info (for PDF reports)
  file_path TEXT,
  file_size INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  
  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_account ON reports(ad_account_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_period ON reports(period);
CREATE INDEX idx_reports_generated ON reports(generated_at DESC);
CREATE INDEX idx_reports_account_type ON reports(ad_account_id, report_type);

-- ========================
-- 2. dashboard_configs table
-- ========================
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Configuration (JSON)
  config JSONB NOT NULL DEFAULT '{
    "layout": "default",
    "widgets": [],
    "theme": "dark",
    "refreshInterval": 30
  }'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_dashboard_configs_user ON dashboard_configs(user_id);

-- ========================
-- Trigger for auto-update
-- ========================
CREATE OR REPLACE FUNCTION update_dashboard_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dashboard_configs_updated_at
BEFORE UPDATE ON dashboard_configs
FOR EACH ROW
EXECUTE FUNCTION update_dashboard_configs_updated_at();

-- Comments
COMMENT ON TABLE reports IS 'Generated reports with data snapshots';
COMMENT ON TABLE dashboard_configs IS 'User dashboard customization settings';

-- ========================
-- Sample Queries
-- ========================

-- Get latest report for account
-- SELECT * FROM reports 
-- WHERE ad_account_id = 'YOUR_ACCOUNT_ID' 
-- ORDER BY generated_at DESC 
-- LIMIT 1;

-- Get user dashboard config
-- SELECT config FROM dashboard_configs 
-- WHERE user_id = 'YOUR_USER_ID';



-------------------אחר כך---------------------------


-- טבלת מודלי למידת מכונה
-- 1 טבלה: ml_models

-- ========================
-- 1. טבלת ml_models
-- ========================
CREATE TABLE IF NOT EXISTS ml_models (
  id BIGSERIAL PRIMARY KEY,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- פרטי מודל
  model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('fraud_detection', 'risk_prediction', 'behavioral_analysis')),
  model_version INTEGER DEFAULT 1,
  
  -- נתוני מודל (JSON)
  model_data JSONB NOT NULL,
  
  -- מדדי ביצועים
  accuracy DECIMAL(5,2),
  precision_score DECIMAL(5,2),
  recall_score DECIMAL(5,2),
  
  -- נתוני אימון
  training_samples INTEGER,
  training_duration INTEGER, -- בשניות
  
  -- סטטוס
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('training', 'active', 'archived')),
  
  -- חותמות זמן
  trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- אינדקסים
CREATE INDEX idx_ml_models_account ON ml_models(ad_account_id);
CREATE INDEX idx_ml_models_type ON ml_models(model_type);
CREATE INDEX idx_ml_models_status ON ml_models(status);
CREATE INDEX idx_ml_models_trained ON ml_models(trained_at DESC);
CREATE UNIQUE INDEX idx_ml_models_active ON ml_models(ad_account_id, model_type) WHERE status = 'active';

-- הערות
COMMENT ON TABLE ml_models IS 'מודלים של למידת מכונה לחיזוי הונאות';
COMMENT ON COLUMN ml_models.model_data IS 'משקולות המודל והגדרות';
COMMENT ON COLUMN ml_models.accuracy IS 'אחוז דיוק המודל';
COMMENT ON COLUMN ml_models.status IS 'סטטוס המודל - רק אחד active לכל חשבון וסוג';

-- שאילתות לדוגמה
-- טעינת מודל אקטיבי
-- SELECT model_data FROM ml_models 
-- WHERE ad_account_id = 'YOUR_ACCOUNT_ID' 
-- AND model_type = 'fraud_detection' 
-- AND status = 'active';

-- שמירת מודל חדש (יבטל את הקודם)
-- UPDATE ml_models SET status = 'archived' 
-- WHERE ad_account_id = 'YOUR_ACCOUNT_ID' 
-- AND model_type = 'fraud_detection' 
-- AND status = 'active';
--
-- INSERT INTO ml_models (...) VALUES (...);



---------------------------אחר כך ב עשה וחצי אחרי שעשה טעות ולא הביא לי כמה ימים-------------



/*
 * טבלאות Database לימים 21-28
 * 
 * ימים 21-24: 9 טבלאות (Advanced Features)
 * ימים 25-28: 6 טבלאות (Integrations)
 * 
 * סה"כ: 15 טבלאות חדשות
 */

-- ============================================
-- יום 21: Advanced Reporting
-- ============================================

-- דוחות מותאמים אישית
CREATE TABLE custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metrics JSONB NOT NULL, -- [{ name, type, config }]
    filters JSONB, -- תנאי סינון
    schedule JSONB, -- { frequency, time, recipients }
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_reports_account ON custom_reports(ad_account_id);

-- דוחות מתוזמנים
CREATE TABLE scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
    frequency VARCHAR(50) NOT NULL, -- daily, weekly, monthly
    schedule_time TIME NOT NULL, -- 08:00, 09:00, etc.
    recipients TEXT[], -- email addresses
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, paused, failed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_reports_next_run ON scheduled_reports(next_run_at, status);

-- ============================================
-- יום 22: RBAC (Role-Based Access Control)
-- ============================================

-- חברי צוות
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- admin, manager, analyst, viewer
    permissions TEXT[], -- הרשאות מותאמות אישית
    added_by UUID REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ad_account_id, user_id)
);

CREATE INDEX idx_team_members_account ON team_members(ad_account_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- הזמנות לצוות
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    permissions TEXT[],
    invited_by UUID REFERENCES users(id),
    invitation_token VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_invitations_email ON team_invitations(email);
CREATE INDEX idx_team_invitations_token ON team_invitations(invitation_token);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    ad_account_id UUID REFERENCES ad_accounts(id),
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_account ON audit_logs(ad_account_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ============================================
-- יום 23: Multi-Account Management
-- ============================================

-- קבוצות חשבונות
CREATE TABLE account_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    account_ids UUID[] NOT NULL, -- מערך של ad_account_id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_account_groups_user ON account_groups(user_id);

-- העדפות משתמש
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    active_account_id UUID REFERENCES ad_accounts(id),
    theme VARCHAR(50) DEFAULT 'light', -- light, dark
    language VARCHAR(10) DEFAULT 'he',
    notifications_enabled BOOLEAN DEFAULT true,
    email_digest_frequency VARCHAR(50) DEFAULT 'daily',
    timezone VARCHAR(100) DEFAULT 'Asia/Jerusalem',
    preferences JSONB, -- העדפות נוספות
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- יום 24: API Documentation
-- ============================================

-- מפתחות API
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash
    tier VARCHAR(50) NOT NULL, -- free, pro, enterprise
    permissions TEXT[] NOT NULL, -- read, write, delete
    rate_limit JSONB NOT NULL, -- { requestsPerMinute, requestsPerHour, requestsPerDay }
    status VARCHAR(50) DEFAULT 'active', -- active, revoked
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_account ON api_keys(ad_account_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_status ON api_keys(status);

-- בקשות API (לוגים)
CREATE TABLE api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
    method VARCHAR(10) NOT NULL, -- GET, POST, etc.
    endpoint VARCHAR(500) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER, -- milliseconds
    user_agent TEXT,
    ip_address INET,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_requests_key ON api_requests(api_key_id);
CREATE INDEX idx_api_requests_timestamp ON api_requests(timestamp DESC);

-- ============================================
-- יום 25: Webhooks System
-- ============================================

-- Webhooks
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    url TEXT NOT NULL,
    events TEXT[] NOT NULL, -- ['click.created', 'detection.created', etc.]
    description TEXT,
    secret VARCHAR(64) NOT NULL, -- HMAC secret
    status VARCHAR(50) DEFAULT 'active', -- active, disabled
    disabled_reason TEXT,
    disabled_at TIMESTAMPTZ,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_account ON webhooks(ad_account_id);
CREATE INDEX idx_webhooks_status ON webhooks(status);

-- היסטוריית משלוחי Webhooks
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    delivery_id VARCHAR(32) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- success, failed
    status_code INTEGER,
    duration_ms INTEGER,
    attempt INTEGER DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- ============================================
-- יום 26: Slack Integration
-- ============================================

-- התקנות Slack
CREATE TABLE slack_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    team_id VARCHAR(50) NOT NULL,
    team_name VARCHAR(255),
    access_token TEXT NOT NULL, -- מוצפן!
    bot_user_id VARCHAR(50),
    default_channel_id VARCHAR(50),
    default_channel_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, disconnected
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ad_account_id)
);

CREATE INDEX idx_slack_installations_account ON slack_installations(ad_account_id);
CREATE INDEX idx_slack_installations_team ON slack_installations(team_id);

-- ============================================
-- יום 27: Microsoft Teams Integration
-- ============================================

-- אינטגרציות Teams
CREATE TABLE teams_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    webhook_url TEXT NOT NULL,
    channel_name VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, disconnected
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ad_account_id)
);

CREATE INDEX idx_teams_integrations_account ON teams_integrations(ad_account_id);

-- ============================================
-- יום 28: Google Sheets Export
-- ============================================

-- תצורות Google Sheets
CREATE TABLE sheets_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
    spreadsheet_id VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    sheet_type VARCHAR(50) NOT NULL, -- clicks, detections, daily_report, qi_history, cost_analysis
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sheets_configs_account ON sheets_configs(ad_account_id);
CREATE INDEX idx_sheets_configs_spreadsheet ON sheets_configs(spreadsheet_id);

-- תצורות סנכרון אוטומטי
CREATE TABLE sheets_sync_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
    spreadsheet_id VARCHAR(100) NOT NULL,
    sheet_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- hourly, daily, realtime
    enabled BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sheets_sync_configs_account ON sheets_sync_configs(ad_account_id);
CREATE INDEX idx_sheets_sync_configs_next ON sheets_sync_configs(next_sync_at, enabled);

-- ============================================
-- סיכום
-- ============================================

/*
סה"כ טבלאות חדשות: 15

ימים 21-24 (Advanced Features):
1. custom_reports
2. scheduled_reports
3. team_members
4. team_invitations
5. audit_logs
6. account_groups
7. user_preferences
8. api_keys
9. api_requests

ימים 25-28 (Integrations):
10. webhooks
11. webhook_deliveries
12. slack_installations
13. teams_integrations
14. sheets_configs
15. sheets_sync_configs

סה"כ טבלאות במערכת: 33 (ביום 20) + 15 = 48 טבלאות
*/



-----------------אחר כך ב אחד עשה ---------------------


/*
 * טבלאות Database לימים 29-32
 * Testing & Quality Tables
 */

-- ============================================
-- יום 29: Integration Tests
-- ============================================

-- תוצאות בדיקות
CREATE TABLE test_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- integration, performance, security
    total INTEGER NOT NULL,
    passed INTEGER NOT NULL,
    failed INTEGER NOT NULL,
    duration INTEGER, -- milliseconds
    results JSONB, -- פירוט מלא
    run_at TIMESTAMPTZ DEFAULT NOW(),
    environment VARCHAR(50) DEFAULT 'development' -- development, staging, production
);

CREATE INDEX idx_test_runs_type ON test_runs(type);
CREATE INDEX idx_test_runs_date ON test_runs(run_at DESC);

-- ============================================
-- יום 30: Performance Testing
-- ============================================

-- תוצאות בדיקות ביצועים
CREATE TABLE performance_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_type VARCHAR(50) NOT NULL, -- load, stress, spike, endurance
    config JSONB NOT NULL, -- תצורת הבדיקה
    metrics JSONB NOT NULL, -- throughput, response times, etc.
    breaking_point INTEGER, -- עבור stress test
    passed BOOLEAN DEFAULT true,
    notes TEXT,
    run_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_perf_test_type ON performance_test_results(test_type);
CREATE INDEX idx_perf_test_date ON performance_test_results(run_at DESC);

-- ============================================
-- יום 31: Security
-- ============================================

-- לוגים של אירועי אבטחה
CREATE TABLE security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL, -- sql_injection_attempt, xss_attempt, rate_limit_exceeded, etc.
    severity VARCHAR(50) NOT NULL, -- low, medium, high, critical
    ip_address INET,
    user_id UUID REFERENCES users(id),
    details JSONB,
    blocked BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_logs_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_severity ON security_logs(severity);
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp DESC);
CREATE INDEX idx_security_logs_ip ON security_logs(ip_address);

-- ============================================
-- יום 32: Monitoring
-- ============================================

-- לוגים של שגיאות
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    severity VARCHAR(50) NOT NULL, -- low, medium, high, critical
    context JSONB, -- request details, user info, etc.
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);

-- ============================================
-- סיכום
-- ============================================

/*
סה"כ טבלאות חדשות: 4

ימים 29-32 (Testing & Quality):
1. test_runs - תוצאות בדיקות (integration/performance/security)
2. performance_test_results - תוצאות ביצועים מפורטות
3. security_logs - אירועי אבטחה ונסיונות פריצה
4. error_logs - שגיאות מערכת וטיפול

סה"כ טבלאות במערכת: 48 (ביום 28) + 4 = 52 טבלאות
*/
