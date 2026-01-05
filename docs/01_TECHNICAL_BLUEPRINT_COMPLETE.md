# 🛡️ MagenAd - TECHNICAL BLUEPRINT V1

**מערכת הגנה על תקציבי Google Ads מפני קליקים בעייתיים**

---

## 📋 תוכן עניינים

1. [עקרונות ארכיטקטורה](#1-עקרונות-ארכיטקטורה)
2. [Stack טכנולוגי מלא](#2-stack-טכנולוגי-מלא)
3. [Database Schema - מפורט](#3-database-schema-מפורט)
4. [API Structure - כל Endpoint](#4-api-structure-כל-endpoint)
5. [Jobs & Scheduling](#5-jobs--scheduling)
6. [Source Key Strategy](#6-source-key-strategy)
7. [Detection Engine - Architecture](#7-detection-engine-architecture)
8. [WhatsApp Business API](#8-whatsapp-business-api)
9. [Security & Authentication](#9-security--authentication)
10. [Scalability Plan](#10-scalability-plan)

---

## 1. עקרונות ארכיטקטורה

### העיקרון המנחה

**המערכת בנויה כשכבת ניטור והחלטה נפרדת לחלוטין ממערכת הפרסום.**

✅ **לא נוגעת בקמפיינים**  
✅ **לא "משפרת"**  
✅ **לא מתערבת**  
✅ **רק מנתחת, מסווגת, ומבצעת פעולות בטוחות**

### 7 שכבות המערכת

```
┌─────────────────────────────────────────┐
│   7. Control Dashboard (React)          │
│   ממשק משתמש + הגדרות                   │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   6. Reporting Layer                    │
│   דוחות חודשיים + WhatsApp             │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   5. Persistence Layer (Supabase)       │
│   שמירת אמת היסטורית                    │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   4. Decision Engine                    │
│   מה עושים עם החריגה                    │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   3. Detection Engine                   │
│   זיהוי חריגות (Rules + Logic)         │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   2. Data Ingestion Layer               │
│   איסוף נתונים גולמיים                 │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   1. Integration Layer                  │
│   Google Ads API (OAuth)                │
└─────────────────────────────────────────┘
```

### כלל ברזל

⚠️ **כל שכבה עצמאית. אף שכבה לא "יודעת" איך אחרת עובדת.**

**למה זה קריטי:**
- יציבות לטווח ארוך
- אפס רגרסיות כשמוסיפים פיצ'רים
- Scalability אמיתי
- תחזוקה קלה

---

## 2. Stack טכנולוגי מלא

### Backend
```
Platform: Node.js 18+ (LTS)
Framework: Express.js 4.18+
Language: JavaScript (ES6+) או TypeScript (אופציונלי)
```

**למה Node.js?**
- מהיר לפיתוח
- עובד מצוין עם Cursor AI
- קהילה ענקית
- ספריות מעולות ל-Google APIs

### Frontend
```
Framework: React 18+
Build Tool: Vite 4+
State Management: Context API (V1), Redux Toolkit (V2)
UI Library: Tailwind CSS + shadcn/ui
```

**למה React + Vite?**
- מהיר מאוד (HMR)
- פשוט לעבוד עם Cursor
- shadcn/ui = רכיבים מוכנים ויפים

### Database
```
Primary DB: Supabase (PostgreSQL)
Auth: Supabase Auth
Storage: Supabase Storage (לוגים)
Realtime: Supabase Realtime (לדשבורד)
```

**למה Supabase?**
- PostgreSQL מנוהל (חזק ויציב)
- Auth מובנה (OAuth + JWT)
- Row Level Security (RLS) - אבטחה מובנית
- Realtime מובנה
- Free tier מעולה (עד 500MB + 50K users)

### External Services

| Service | Purpose | Cost |
|---------|---------|------|
| Google Ads API | קריאת נתוני קליקים | חינם (עד 15K/day) |
| WhatsApp Business API | הודעות חודשיות | חינם (עד 1000/חודש) |
| Node Cron | תזמון Jobs | חינם (בתוך Node) |
| Vercel/Railway | Hosting | $5-20/חודש |

### Development Tools
```
Package Manager: npm או pnpm
Version Control: Git + GitHub
CI/CD: GitHub Actions (פשוט)
Monitoring: Supabase Dashboard + Console logs
Testing: Jest (Unit), Playwright (E2E) - אופציונלי ב-V1
```

---

## 3. Database Schema - מפורט

### 3.1 טבלה: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

**Supabase Auth Integration:**
- Supabase Auth טבלה: `auth.users`
- קישור: `users.id = auth.users.id` (UUID זהה)

---

### 3.2 טבלה: `ad_accounts`
```sql
CREATE TABLE ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_customer_id TEXT NOT NULL, -- Google Ads Customer ID
  account_name TEXT,
  
  -- OAuth Tokens (מוצפנים ע"י Supabase)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Connection Status
  connection_status TEXT DEFAULT 'active', -- active, expired, error, disconnected
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- success, failed, partial
  last_error_message TEXT,
  
  -- Metadata
  currency TEXT DEFAULT 'ILS',
  timezone TEXT DEFAULT 'Asia/Jerusalem',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, google_customer_id)
);

-- Indexes
CREATE INDEX idx_ad_accounts_user ON ad_accounts(user_id);
CREATE INDEX idx_ad_accounts_customer_id ON ad_accounts(google_customer_id);
CREATE INDEX idx_ad_accounts_status ON ad_accounts(connection_status);
```

**Security Note:**
- Supabase מצפין אוטומטית את `access_token` ו-`refresh_token`
- RLS Policy: משתמש רואה רק את החשבונות שלו

---

### 3.3 טבלה: `profiles` (הגדרות זיהוי)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  profile_type TEXT DEFAULT 'normal', -- easy, normal, aggressive, custom
  
  -- Thresholds (JSON מכיל את כל הספים)
  thresholds JSONB DEFAULT '{
    "frequency": {
      "rapid_repeat_clicks": 3,
      "rapid_repeat_window_minutes": 2,
      "short_window_clicks": 5,
      "short_window_minutes": 10,
      "daily_repeat_source": 8
    },
    "burst": {
      "account_spike_multiplier": 2.0,
      "campaign_spike_multiplier": 2.3,
      "micro_burst_clicks": 12,
      "micro_burst_window_minutes": 2
    },
    "temporal": {
      "off_hours_percentage": 30,
      "business_hours_start": 8,
      "business_hours_end": 18
    },
    "cooldown_hours": 12
  }'::jsonb,
  
  -- Business Hours (JSON)
  business_hours JSONB DEFAULT '{
    "enabled": true,
    "timezone": "Asia/Jerusalem",
    "days": {
      "sunday": {"enabled": true, "start": "08:00", "end": "18:00"},
      "monday": {"enabled": true, "start": "08:00", "end": "18:00"},
      "tuesday": {"enabled": true, "start": "08:00", "end": "18:00"},
      "wednesday": {"enabled": true, "start": "08:00", "end": "18:00"},
      "thursday": {"enabled": true, "start": "08:00", "end": "18:00"},
      "friday": {"enabled": true, "start": "08:00", "end": "14:00"},
      "saturday": {"enabled": false, "start": null, "end": null}
    }
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ad_account_id)
);

-- Index
CREATE INDEX idx_profiles_account ON profiles(ad_account_id);
CREATE INDEX idx_profiles_type ON profiles(profile_type);
```

**Profile Types מוגדרים מראש:**
```javascript
// Easy (זהיר)
{ frequency: { rapid_repeat_clicks: 4, ... }, ... }

// Normal (מומלץ)
{ frequency: { rapid_repeat_clicks: 3, ... }, ... }

// Aggressive (רגיש)
{ frequency: { rapid_repeat_clicks: 2, ... }, ... }

// Custom (משתמש מגדיר)
{ ... }
```

---

### 3.4 טבלה: `raw_events` (נתונים גולמיים)
```sql
CREATE TABLE raw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- Google Ads Data
  click_id TEXT, -- GCLID
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  ad_group_id TEXT,
  ad_group_name TEXT,
  
  -- Click Details
  click_timestamp TIMESTAMPTZ NOT NULL,
  device_type TEXT, -- MOBILE, DESKTOP, TABLET
  network TEXT, -- SEARCH, DISPLAY, SHOPPING, VIDEO
  country TEXT, -- ISO code (IL, US, etc)
  
  -- Cost (לא לחישוב, רק הקשר)
  click_cost_micros BIGINT, -- Google מחזיר במיקרו-יחידות
  
  -- Metadata
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ad_account_id, click_id, click_timestamp)
);

-- Indexes (קריטיים לביצועים!)
CREATE INDEX idx_raw_events_account ON raw_events(ad_account_id);
CREATE INDEX idx_raw_events_timestamp ON raw_events(click_timestamp);
CREATE INDEX idx_raw_events_campaign ON raw_events(campaign_id);
CREATE INDEX idx_raw_events_device_network ON raw_events(device_type, network);

-- Partition (אופציונלי, ל-scalability)
-- ניתן לעשות partitioning לפי חודש אם יש מעל 10M events
```

**Idempotency:**
- `UNIQUE(ad_account_id, click_id, click_timestamp)` מונע כפילויות
- אם Job רץ פעמיים - לא נכנס duplicate

---

### 3.5 טבלה: `baseline_stats` (סטטיסטיקות בסיס)
```sql
CREATE TABLE baseline_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT, -- NULL = account-level
  
  metric_type TEXT NOT NULL, -- clicks_per_day, clicks_per_hour, device_distribution, etc
  period_days INTEGER NOT NULL, -- 7, 14, 30
  
  -- Stats
  avg_value NUMERIC,
  std_dev NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  data_points INTEGER, -- כמה ימים בפועל היו בחישוב
  
  UNIQUE(ad_account_id, campaign_id, metric_type, period_days)
);

-- Indexes
CREATE INDEX idx_baseline_account ON baseline_stats(ad_account_id);
CREATE INDEX idx_baseline_campaign ON baseline_stats(campaign_id);
CREATE INDEX idx_baseline_metric ON baseline_stats(metric_type);
```

**Metric Types:**
- `clicks_per_day` - ממוצע קליקים ליום
- `clicks_per_hour` - התפלגות לפי שעה
- `device_distribution` - % מובייל/דסקטופ/טאבלט
- `network_distribution` - % Search/Display
- `country_distribution` - % לפי מדינה

---

### 3.6 טבלה: `detections` (חריגות שזוהו)
```sql
CREATE TABLE detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT,
  
  -- Rule Details
  rule_id TEXT NOT NULL, -- A1, A2, B1, etc
  rule_name TEXT NOT NULL,
  severity TEXT NOT NULL, -- low, medium, high
  
  -- Time Window
  time_window_start TIMESTAMPTZ NOT NULL,
  time_window_end TIMESTAMPTZ NOT NULL,
  
  -- Evidence (JSON)
  evidence JSONB, -- { clicks_count: 5, source_key: "...", threshold: 3, ... }
  
  -- Decision
  action_decided TEXT, -- mark, report, recommend
  action_status TEXT DEFAULT 'pending', -- pending, success, failed, skipped
  action_executed_at TIMESTAMPTZ,
  action_response TEXT, -- תשובה מGoogle או הודעת שגיאה
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- למניעת duplicates
  UNIQUE(ad_account_id, rule_id, time_window_start, campaign_id)
);

-- Indexes
CREATE INDEX idx_detections_account ON detections(ad_account_id);
CREATE INDEX idx_detections_created ON detections(created_at);
CREATE INDEX idx_detections_severity ON detections(severity);
CREATE INDEX idx_detections_status ON detections(action_status);
```

---

### 3.7 טבלה: `cooldown_tracker` (מנגנון Cooldown)
```sql
CREATE TABLE cooldown_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL, -- campaign, source_key
  entity_id TEXT NOT NULL, -- campaign_id או source_key value
  rule_id TEXT NOT NULL,
  
  cooldown_until TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ad_account_id, entity_type, entity_id, rule_id)
);

-- Index
CREATE INDEX idx_cooldown_active ON cooldown_tracker(ad_account_id, cooldown_until)
  WHERE cooldown_until > NOW();
```

**שימוש:**
```javascript
// לפני שמריצים Rule, בודקים:
const inCooldown = await supabase
  .from('cooldown_tracker')
  .select('id')
  .eq('ad_account_id', accountId)
  .eq('entity_type', 'campaign')
  .eq('entity_id', campaignId)
  .eq('rule_id', 'A1')
  .gt('cooldown_until', new Date())
  .single();

if (inCooldown) {
  console.log('Campaign in cooldown, skipping detection');
  return;
}
```

---

### 3.8 טבלה: `monthly_reports` (דוחות חודשיים)
```sql
CREATE TABLE monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  -- Period
  report_month INTEGER NOT NULL, -- 1-12
  report_year INTEGER NOT NULL, -- 2025, 2026
  
  -- Stats
  total_clicks_checked INTEGER DEFAULT 0,
  suspicious_clicks INTEGER DEFAULT 0,
  actions_taken INTEGER DEFAULT 0,
  
  -- Quiet Index
  quiet_score INTEGER, -- 0-100
  quiet_status TEXT, -- quiet (80-100), normal (50-79), alert (0-49)
  
  -- System Activity
  system_active_days INTEGER,
  scans_performed INTEGER,
  
  -- Report Data (JSON)
  report_data JSONB, -- פירוט מלא לדשבורד
  
  -- Delivery
  sent_at TIMESTAMPTZ,
  sent_via TEXT, -- whatsapp, email
  send_status TEXT, -- pending, sent, failed
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ad_account_id, report_year, report_month)
);

-- Indexes
CREATE INDEX idx_reports_account ON monthly_reports(ad_account_id);
CREATE INDEX idx_reports_period ON monthly_reports(report_year, report_month);
CREATE INDEX idx_reports_unsent ON monthly_reports(send_status) WHERE send_status = 'pending';
```

---

### 3.9 טבלה: `detection_state` (מצב למידה)
```sql
CREATE TABLE detection_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  
  learning_mode BOOLEAN DEFAULT TRUE,
  learning_started_at TIMESTAMPTZ DEFAULT NOW(),
  baseline_ready_at TIMESTAMPTZ,
  
  -- Stats
  days_with_data INTEGER DEFAULT 0,
  total_events_collected INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(ad_account_id)
);

-- Index
CREATE INDEX idx_state_learning ON detection_state(ad_account_id, learning_mode);
```

**Learning Mode Logic:**
```javascript
// אחרי 7 ימים עם נתונים:
if (state.days_with_data >= 7 && state.total_events_collected >= 100) {
  await supabase
    .from('detection_state')
    .update({
      learning_mode: false,
      baseline_ready_at: new Date()
    })
    .eq('ad_account_id', accountId);
}
```

---

### 3.10 טבלה: `audit_log` (שקיפות)
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action_type TEXT NOT NULL, -- profile_changed, threshold_updated, manual_report, etc
  entity_type TEXT, -- profile, detection, campaign
  entity_id UUID,
  
  -- Changes
  old_value JSONB,
  new_value JSONB,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_account ON audit_log(ad_account_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

---

## 4. API Structure - כל Endpoint

### 4.1 Authentication

#### `POST /api/auth/signup`
```javascript
Request:
{
  email: "user@example.com",
  password: "********",
  full_name: "John Doe",
  phone: "+972501234567"
}

Response:
{
  user: { id, email, ... },
  session: { access_token, refresh_token, expires_at }
}
```

#### `POST /api/auth/login`
```javascript
Request:
{
  email: "user@example.com",
  password: "********"
}

Response:
{
  user: { id, email, ... },
  session: { access_token, ... }
}
```

#### `POST /api/auth/logout`
```javascript
Headers: Authorization: Bearer {token}

Response:
{ success: true }
```

---

### 4.2 Google Ads Integration

#### `GET /api/google-ads/oauth-url`
```javascript
// יוצר URL ל-OAuth flow

Response:
{
  auth_url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

#### `POST /api/google-ads/oauth-callback`
```javascript
Request:
{
  code: "4/0AfJoh...",
  state: "random_state_string"
}

Response:
{
  success: true,
  accounts: [
    {
      customer_id: "1234567890",
      name: "My Campaign Account"
    }
  ]
}

// שומר את ה-tokens ב-ad_accounts
```

#### `POST /api/google-ads/connect-account`
```javascript
Request:
{
  customer_id: "1234567890",
  account_name: "My Main Account"
}

Response:
{
  ad_account: {
    id: "uuid",
    google_customer_id: "1234567890",
    connection_status: "active"
  }
}
```

#### `POST /api/google-ads/disconnect-account`
```javascript
Request:
{
  ad_account_id: "uuid"
}

Response:
{ success: true }
```

#### `GET /api/google-ads/accounts`
```javascript
// רשימת חשבונות מחוברים של המשתמש

Response:
{
  accounts: [
    {
      id: "uuid",
      google_customer_id: "1234567890",
      account_name: "My Account",
      connection_status: "active",
      last_sync_at: "2025-12-29T10:30:00Z"
    }
  ]
}
```

---

### 4.3 Profiles (הגדרות זיהוי)

#### `GET /api/profiles/:ad_account_id`
```javascript
Response:
{
  profile: {
    id: "uuid",
    profile_type: "normal",
    thresholds: { ... },
    business_hours: { ... }
  }
}
```

#### `PUT /api/profiles/:ad_account_id`
```javascript
Request:
{
  profile_type: "aggressive",
  // או
  thresholds: {
    frequency: {
      rapid_repeat_clicks: 2,
      ...
    }
  }
}

Response:
{
  profile: { ... },
  audit_entry: { id: "uuid", action_type: "profile_changed" }
}
```

#### `POST /api/profiles/:ad_account_id/reset`
```javascript
// מחזיר להגדרות ברירת מחדל

Response:
{
  profile: { profile_type: "normal", ... }
}
```

---

### 4.4 Dashboard Data

#### `GET /api/dashboard/overview/:ad_account_id`
```javascript
Response:
{
  connection_status: "active",
  learning_mode: false,
  current_month: {
    clicks_checked: 1543,
    suspicious: 47,
    actions: 12,
    quiet_score: 85,
    quiet_status: "quiet"
  },
  last_sync: "2025-12-29T10:30:00Z",
  system_health: "ok"
}
```

#### `GET /api/dashboard/detections/:ad_account_id`
```javascript
Query params:
- from: ISO date
- to: ISO date
- severity: low|medium|high
- campaign_id: optional

Response:
{
  detections: [
    {
      id: "uuid",
      rule_name: "Rapid Repeat Clicks",
      severity: "high",
      campaign_name: "Campaign A",
      time_window_start: "2025-12-29T08:00:00Z",
      action_decided: "report",
      action_status: "success"
    }
  ],
  total: 47,
  page: 1
}
```

#### `GET /api/dashboard/monthly-report/:ad_account_id/:year/:month`
```javascript
Response:
{
  report: {
    total_clicks_checked: 4521,
    suspicious_clicks: 134,
    actions_taken: 38,
    quiet_score: 78,
    quiet_status: "normal",
    sent_at: "2025-12-01T00:05:00Z"
  },
  top_campaigns: [
    { campaign_name: "Campaign A", detections: 12 }
  ]
}
```

---

### 4.5 Admin/Maintenance

#### `POST /api/admin/trigger-sync/:ad_account_id`
```javascript
// מריץ ידנית sync של נתונים

Response:
{
  job_id: "uuid",
  status: "started"
}
```

#### `POST /api/admin/recalculate-baseline/:ad_account_id`
```javascript
// מחשב מחדש baseline

Response:
{
  baseline_updated: true,
  metrics: ["clicks_per_day", "device_distribution", ...]
}
```

---

## 5. Jobs & Scheduling

### Job 1: `ingest-clicks` (איסוף קליקים)

**תדירות:** כל 6 שעות  
**Cron:** `0 */6 * * *`

```javascript
// jobs/ingest-clicks.js
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const { GoogleAdsApi } = require('google-ads-api');

cron.schedule('0 */6 * * *', async () => {
  console.log('Starting click ingestion job...');
  
  // 1. שלוף את כל החשבונות הפעילים
  const { data: accounts } = await supabase
    .from('ad_accounts')
    .select('*')
    .eq('connection_status', 'active');
  
  for (const account of accounts) {
    try {
      // 2. בדוק אם Token עדיין תקף
      if (new Date(account.token_expires_at) < new Date()) {
        await refreshToken(account);
      }
      
      // 3. שלוף clicks מ-6 שעות אחרונות
      const clicks = await fetchClicksFromGoogle(account, {
        from: new Date(Date.now() - 6 * 60 * 60 * 1000),
        to: new Date()
      });
      
      // 4. שמור ב-raw_events (idempotent)
      await supabase.from('raw_events').upsert(clicks, {
        onConflict: 'ad_account_id,click_id,click_timestamp',
        ignoreDuplicates: true
      });
      
      // 5. עדכן last_sync
      await supabase
        .from('ad_accounts')
        .update({
          last_sync_at: new Date(),
          last_sync_status: 'success'
        })
        .eq('id', account.id);
      
    } catch (error) {
      console.error(`Failed to sync account ${account.id}:`, error);
      
      // שמור שגיאה
      await supabase
        .from('ad_accounts')
        .update({
          last_sync_status: 'failed',
          last_error_message: error.message
        })
        .eq('id', account.id);
    }
  }
  
  console.log('Click ingestion job completed');
});

async function fetchClicksFromGoogle(account, { from, to }) {
  const client = new GoogleAdsApi({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
  });
  
  const customer = client.Customer({
    customer_id: account.google_customer_id,
    refresh_token: account.refresh_token,
  });
  
  const query = `
    SELECT
      click_view.gclid,
      click_view.ad_group_ad,
      segments.date,
      segments.hour,
      segments.device,
      segments.click_type,
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name,
      metrics.clicks,
      metrics.cost_micros,
      user_location_view.country_criterion_id
    FROM click_view
    WHERE segments.date >= '${formatDate(from)}'
      AND segments.date <= '${formatDate(to)}'
  `;
  
  const result = await customer.query(query);
  
  return result.map(row => ({
    ad_account_id: account.id,
    click_id: row.click_view.gclid,
    campaign_id: String(row.campaign.id),
    campaign_name: row.campaign.name,
    ad_group_id: String(row.ad_group.id),
    ad_group_name: row.ad_group.name,
    click_timestamp: new Date(`${row.segments.date}T${row.segments.hour}:00:00Z`),
    device_type: row.segments.device,
    network: row.segments.click_type,
    country: getCountryCode(row.user_location_view?.country_criterion_id),
    click_cost_micros: row.metrics.cost_micros || 0
  }));
}
```

---

### Job 2: `calculate-baseline` (חישוב Baseline)

**תדירות:** פעם ביום (בלילה)  
**Cron:** `0 2 * * *` (02:00 AM)

```javascript
// jobs/calculate-baseline.js
cron.schedule('0 2 * * *', async () => {
  console.log('Starting baseline calculation...');
  
  const { data: accounts } = await supabase
    .from('ad_accounts')
    .select('id')
    .eq('connection_status', 'active');
  
  for (const account of accounts) {
    // חשב baseline ל-14 ימים אחרונים
    await calculateBaseline(account.id, 14);
    
    // בדוק אם צריך לצאת מ-Learning Mode
    const { data: state } = await supabase
      .from('detection_state')
      .select('*')
      .eq('ad_account_id', account.id)
      .single();
    
    if (state?.learning_mode) {
      const daysWithData = await countDaysWithData(account.id);
      const totalEvents = await countTotalEvents(account.id);
      
      if (daysWithData >= 7 && totalEvents >= 100) {
        await supabase
          .from('detection_state')
          .update({
            learning_mode: false,
            baseline_ready_at: new Date(),
            days_with_data: daysWithData,
            total_events_collected: totalEvents
          })
          .eq('ad_account_id', account.id);
        
        console.log(`Account ${account.id} exited learning mode`);
      }
    }
  }
});

async function calculateBaseline(accountId, periodDays) {
  const metrics = [
    'clicks_per_day',
    'clicks_per_hour',
    'device_distribution',
    'network_distribution'
  ];
  
  for (const metric of metrics) {
    const stats = await computeMetricStats(accountId, metric, periodDays);
    
    await supabase.from('baseline_stats').upsert({
      ad_account_id: accountId,
      campaign_id: null, // account-level
      metric_type: metric,
      period_days: periodDays,
      ...stats,
      calculated_at: new Date()
    }, {
      onConflict: 'ad_account_id,campaign_id,metric_type,period_days'
    });
  }
}
```

---

### Job 3: `run-detection` (הרצת חוקי זיהוי)

**תדירות:** כל שעה  
**Cron:** `0 * * * *`

```javascript
// jobs/run-detection.js
cron.schedule('0 * * * *', async () => {
  console.log('Starting detection job...');
  
  const { data: accounts } = await supabase
    .from('ad_accounts')
    .select(`
      *,
      profiles(*),
      detection_state(*)
    `)
    .eq('connection_status', 'active');
  
  for (const account of accounts) {
    // דלג על חשבונות ב-Learning Mode
    if (account.detection_state?.learning_mode) {
      console.log(`Account ${account.id} in learning mode, skipping`);
      continue;
    }
    
    // הרץ את כל החוקים
    await runAllRules(account);
  }
});

async function runAllRules(account) {
  const rules = [
    { id: 'A1', name: 'Rapid Repeat Clicks', fn: detectRapidRepeat },
    { id: 'A2', name: 'Short Window Repeat', fn: detectShortWindow },
    { id: 'B1', name: 'Account Spike', fn: detectAccountSpike },
    { id: 'B2', name: 'Campaign Spike', fn: detectCampaignSpike },
    { id: 'B3', name: 'Micro-Burst', fn: detectMicroBurst },
    { id: 'C1', name: 'Off-Hours Activity', fn: detectOffHours },
    // ... שאר החוקים
  ];
  
  for (const rule of rules) {
    try {
      const detections = await rule.fn(account);
      
      if (detections.length > 0) {
        console.log(`Rule ${rule.id} found ${detections.length} detections`);
        
        // שמור ב-DB
        await saveDetections(account.id, detections);
        
        // הפעל פעולות (report/mark)
        await executeActions(account.id, detections);
      }
    } catch (error) {
      console.error(`Rule ${rule.id} failed:`, error);
    }
  }
}

// דוגמה לחוק A1
async function detectRapidRepeat(account) {
  const thresholds = account.profiles.thresholds.frequency;
  const windowMinutes = thresholds.rapid_repeat_window_minutes;
  const maxClicks = thresholds.rapid_repeat_clicks;
  
  // שלוף קליקים משעה אחרונה
  const { data: clicks } = await supabase
    .from('raw_events')
    .select('*')
    .eq('ad_account_id', account.id)
    .gte('click_timestamp', new Date(Date.now() - 60 * 60 * 1000))
    .order('click_timestamp', { ascending: true });
  
  // קבץ לפי Source Key
  const grouped = groupBySourceKey(clicks);
  
  const detections = [];
  
  for (const [sourceKey, sourceClicks] of Object.entries(grouped)) {
    // בדוק חלון זמן נע
    for (let i = 0; i < sourceClicks.length; i++) {
      const windowStart = sourceClicks[i].click_timestamp;
      const windowEnd = new Date(windowStart.getTime() + windowMinutes * 60 * 1000);
      
      const clicksInWindow = sourceClicks.filter(c => 
        c.click_timestamp >= windowStart && c.click_timestamp <= windowEnd
      );
      
      if (clicksInWindow.length >= maxClicks) {
        // בדוק אם יש cooldown
        const inCooldown = await checkCooldown(
          account.id,
          'source_key',
          sourceKey,
          'A1'
        );
        
        if (!inCooldown) {
          detections.push({
            rule_id: 'A1',
            rule_name: 'Rapid Repeat Clicks',
            severity: 'high',
            time_window_start: windowStart,
            time_window_end: windowEnd,
            campaign_id: clicksInWindow[0].campaign_id,
            evidence: {
              source_key: sourceKey,
              clicks_count: clicksInWindow.length,
              threshold: maxClicks,
              device_type: clicksInWindow[0].device_type,
              network: clicksInWindow[0].network
            },
            action_decided: 'report'
          });
          
          // הוסף cooldown
          await setCooldown(
            account.id,
            'source_key',
            sourceKey,
            'A1',
            account.profiles.thresholds.cooldown_hours
          );
        }
        
        break; // מצאנו חריגה, עבור ל-source הבא
      }
    }
  }
  
  return detections;
}

function groupBySourceKey(clicks) {
  const grouped = {};
  
  for (const click of clicks) {
    const key = generateSourceKey(click);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(click);
  }
  
  return grouped;
}
```

---

### Job 4: `generate-monthly-report` (דוח חודשי)

**תדירות:** יום 1 לחודש, 00:05  
**Cron:** `5 0 1 * *`

```javascript
// jobs/generate-monthly-report.js
cron.schedule('5 0 1 * *', async () => {
  console.log('Generating monthly reports...');
  
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const year = lastMonth.getFullYear();
  const month = lastMonth.getMonth() + 1;
  
  const { data: accounts } = await supabase
    .from('ad_accounts')
    .select(`
      *,
      users(email, whatsapp_number)
    `);
  
  for (const account of accounts) {
    try {
      const report = await generateReport(account.id, year, month);
      
      // שמור ב-DB
      await supabase.from('monthly_reports').insert({
        ad_account_id: account.id,
        report_year: year,
        report_month: month,
        ...report,
        send_status: 'pending'
      });
      
      // שלח WhatsApp
      await sendWhatsAppReport(account, report);
      
    } catch (error) {
      console.error(`Failed to generate report for ${account.id}:`, error);
    }
  }
});

async function generateReport(accountId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  // סה"כ קליקים
  const { count: totalClicks } = await supabase
    .from('raw_events')
    .select('*', { count: 'exact', head: true })
    .eq('ad_account_id', accountId)
    .gte('click_timestamp', startDate.toISOString())
    .lte('click_timestamp', endDate.toISOString());
  
  // חריגות
  const { data: detections } = await supabase
    .from('detections')
    .select('*')
    .eq('ad_account_id', accountId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());
  
  const suspiciousClicks = detections.length;
  const actionsTaken = detections.filter(d => d.action_status === 'success').length;
  
  // חשב Quiet Index
  const quietScore = calculateQuietIndex(detections);
  
  return {
    total_clicks_checked: totalClicks,
    suspicious_clicks: suspiciousClicks,
    actions_taken: actionsTaken,
    quiet_score: quietScore,
    quiet_status: getQuietStatus(quietScore),
    system_active_days: 30, // או חישוב אמיתי
    scans_performed: 30 * 4, // 4 scans/day
    report_data: {
      top_campaigns: await getTopCampaigns(accountId, startDate, endDate),
      severity_breakdown: getSeverityBreakdown(detections)
    }
  };
}

function calculateQuietIndex(detections) {
  let score = 100;
  
  for (const det of detections) {
    if (det.severity === 'high') score -= 10;
    else if (det.severity === 'medium') score -= 5;
    else if (det.severity === 'low') score -= 2;
  }
  
  return Math.max(0, Math.min(100, score));
}

function getQuietStatus(score) {
  if (score >= 80) return 'quiet'; // 🟢
  if (score >= 50) return 'normal'; // 🟡
  return 'alert'; // 🔴
}
```

---

## 6. Source Key Strategy

### הבעיה
Google Ads API **לא נותן IP Address** (פרטיות).  
אז איך מזהים "אותו מקור לחץ 3 פעמים"?

### הפתרון: Source Key מורכב

```javascript
function generateSourceKey(click) {
  // משלבים מספר נקודות נתונים
  const parts = [
    click.device_type,        // MOBILE/DESKTOP/TABLET
    click.network,            // SEARCH/DISPLAY
    click.country,            // IL/US/etc
    click.campaign_id         // Campaign ספציפי
  ];
  
  return parts.join('::');
}

// דוגמאות:
// "MOBILE::SEARCH::IL::12345"
// "DESKTOP::DISPLAY::US::67890"
```

### למה זה עובד?

1. **Device Type** - בוט/מתחרה בד"כ משתמש באותו סוג מכשיר
2. **Network** - Search vs Display = התנהגות שונה
3. **Country** - מתקפות בד"כ ממקום ספציפי
4. **Campaign ID** - מפצל בין קמפיינים

### False Positives - איך מונעים?

**Scenario:** אדם רגיל מחפש "אינסטלטור תל אביב" 3 פעמים בשעה (ראה מודעה, לא לחץ, חזר, חיפש שוב).

**Mitigation:**
```javascript
// חוק A1 דורש 3 קליקים ב-2 דקות (לא בשעה!)
// אדם רגיל לא לוחץ 3 פעמים ב-120 שניות

// אם בכל זאת קורה:
// 1. Cooldown למנוע spam של דיווחים
// 2. Escalation - רק אם יש עוד חוקים (E1)
```

### V2 Upgrade (עם Pixel)

```javascript
// אם יש Pixel באתר:
function generateSourceKey(click, pixelData) {
  const fingerprint = generateFingerprint({
    userAgent: pixelData.userAgent,
    screenResolution: pixelData.screen,
    timezone: pixelData.timezone,
    plugins: pixelData.plugins,
    canvas: pixelData.canvasHash
  });
  
  return `${fingerprint}::${click.campaign_id}`;
}
// דיוק של 95%+
```

---

## 7. Detection Engine - Architecture

### Flow Diagram

```
┌─────────────────────────────────────────┐
│  Job: run-detection (hourly)            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Load Active Accounts (not in learning) │
└─────────────────────────────────────────┘
                    ↓
          ┌─────────────────┐
          │  For Each Account│
          └─────────────────┘
                    ↓
          ┌─────────────────┐
          │  Load Profile    │
          │  (thresholds)    │
          └─────────────────┘
                    ↓
          ┌─────────────────┐
          │  Run All Rules   │
          │  (A1, A2, ...)   │
          └─────────────────┘
                    ↓
          ┌─────────────────┐
          │  Filter by       │
          │  Cooldown        │
          └─────────────────┘
                    ↓
          ┌─────────────────┐
          │  Save Detections │
          │  to DB           │
          └─────────────────┘
                    ↓
          ┌─────────────────┐
          │  Execute Actions │
          │  (Report/Mark)   │
          └─────────────────┘
                    ↓
          ┌─────────────────┐
          │  Set Cooldowns   │
          └─────────────────┘
```

### Rule Structure (טמפלט)

```javascript
// rules/template.js
class DetectionRule {
  constructor(id, name, severity) {
    this.id = id;
    this.name = name;
    this.severity = severity;
  }
  
  async detect(account, timeWindow) {
    // 1. שלוף נתונים רלוונטיים
    const data = await this.fetchData(account, timeWindow);
    
    // 2. שלוף thresholds מהפרופיל
    const thresholds = this.getThresholds(account.profiles);
    
    // 3. הרץ לוגיקת זיהוי
    const violations = this.analyze(data, thresholds);
    
    // 4. סנן לפי cooldown
    const filtered = await this.filterCooldowns(violations, account.id);
    
    // 5. החזר detections
    return filtered.map(v => this.formatDetection(v));
  }
  
  async fetchData(account, timeWindow) {
    // Override בכל rule
    throw new Error('Must implement fetchData');
  }
  
  getThresholds(profile) {
    // Override בכל rule
    throw new Error('Must implement getThresholds');
  }
  
  analyze(data, thresholds) {
    // Override בכל rule
    throw new Error('Must implement analyze');
  }
  
  formatDetection(violation) {
    return {
      rule_id: this.id,
      rule_name: this.name,
      severity: this.severity,
      time_window_start: violation.windowStart,
      time_window_end: violation.windowEnd,
      campaign_id: violation.campaignId,
      evidence: violation.evidence,
      action_decided: this.decideAction()
    };
  }
  
  decideAction() {
    // V1: כולם report או mark
    if (this.severity === 'high') return 'report';
    return 'mark';
  }
}

module.exports = DetectionRule;
```

---

## 8. WhatsApp Business API

### Setup

1. **צור Facebook Business Account**
   - https://business.facebook.com/

2. **צור WhatsApp Business Account**
   - דרך Meta Business Suite

3. **קבל Phone Number ID**
   - WhatsApp Manager → Phone Numbers

4. **קבל Access Token**
   - Graph API Explorer או App Settings

### Integration Code

```javascript
// services/whatsapp.js
const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }
  
  async sendMonthlyReport(recipient, report) {
    const message = this.formatReportMessage(report);
    
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to: recipient, // +972501234567
          type: 'text',
          text: {
            body: message
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return { success: true, messageId: response.data.messages[0].id };
      
    } catch (error) {
      console.error('WhatsApp send failed:', error.response?.data);
      return { success: false, error: error.message };
    }
  }
  
  formatReportMessage(report) {
    const emoji = report.quiet_status === 'quiet' ? '🟢' 
                : report.quiet_status === 'normal' ? '🟡' 
                : '🔴';
    
    return `
*דוח חודשי - MagenAd* ${emoji}

📊 *סיכום:*
• נבדקו: ${report.total_clicks_checked.toLocaleString()} קליקים
• חשודים: ${report.suspicious_clicks}
• פעולות: ${report.actions_taken}

${emoji} *מדד שקט:* ${report.quiet_score}/100

🔍 המערכת פעילה ${report.system_active_days} ימים
⚙️ בוצעו ${report.scans_performed} סריקות

🔗 לפירוט מלא: https://app.magenad.com
    `.trim();
  }
}

module.exports = new WhatsAppService();
```

### Template Approval (חובה!)

WhatsApp דורש אישור מראש של תבניות הודעות.

**צעדים:**
1. WhatsApp Manager → Message Templates
2. Create Template
3. שם: `monthly_report`
4. קטגוריה: `UTILITY`
5. תוכן:
```
*דוח חודשי - MagenAd* {{1}}

📊 *סיכום:*
• נבדקו: {{2}} קליקים
• חשודים: {{3}}
• פעולות: {{4}}

{{5}} *מדד שקט:* {{6}}/100

🔗 לפירוט מלא: {{7}}
```
6. Submit → אישור תוך 24-48 שעות

---

## 9. Security & Authentication

### Supabase Auth Flow

```javascript
// 1. Signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
});

// 2. Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// 3. Get Session
const { data: { session } } = await supabase.auth.getSession();

// 4. Refresh Token (אוטומטי!)
// Supabase מרענן אוטומטית כשהtoken קרוב לפוג
```

### Row Level Security (RLS)

```sql
-- Policy: משתמש רואה רק את הנתונים שלו

-- users table
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- ad_accounts table
CREATE POLICY "Users can view own accounts"
ON ad_accounts FOR SELECT
USING (auth.uid() = user_id);

-- detections table
CREATE POLICY "Users can view own detections"
ON detections FOR SELECT
USING (
  ad_account_id IN (
    SELECT id FROM ad_accounts WHERE user_id = auth.uid()
  )
);
```

### Google OAuth Tokens - Encryption

```javascript
// Supabase מצפין אוטומטית columns
// אבל אפשר גם להוסיף שכבה:

const crypto = require('crypto');

function encryptToken(token) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decryptToken(encryptedToken) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  
  const [ivHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### API Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 100, // 100 requests
  message: 'Too many requests, please try again later'
});

// שימוש:
app.use('/api/', apiLimiter);
```

---

## 10. Scalability Plan

### עד 100 לקוחות - V1 מספיק

```
Supabase Free Tier:
- 500 MB Database
- 2 GB Bandwidth/month
- 50K Monthly Active Users

זה מספיק ל:
- 100 לקוחות
- כל אחד 10K קליקים/חודש = 1M קליקים סה"כ
- raw_events: ~200 MB (עם indexes)
```

### 100-500 לקוחות - Supabase Pro

```
Supabase Pro: $25/month
- 8 GB Database
- 250 GB Bandwidth
- Point-in-time Recovery

זה מספיק ל:
- 500 לקוחות
- 5M קליקים/חודש
```

### 500-1000 לקוחות - Optimizations

**1. Database Partitioning**
```sql
-- Partition raw_events לפי חודש
CREATE TABLE raw_events_2025_01 PARTITION OF raw_events
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE raw_events_2025_02 PARTITION OF raw_events
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

**2. Background Jobs - Separate Worker**
```
Main Server: API + Dashboard
Worker Server: Jobs (cron)

Deploy worker on Railway/Render
Cost: +$7/month
```

**3. Caching Layer**
```javascript
// Redis for hot data
const redis = require('redis');
const client = redis.createClient();

// Cache baseline stats (TTL: 1 hour)
const cacheKey = `baseline:${accountId}:clicks_per_day`;
const cached = await client.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const fresh = await calculateBaseline(...);
await client.setex(cacheKey, 3600, JSON.stringify(fresh));
return fresh;
```

**4. Read Replicas**
```
Primary DB: Writes (Jobs)
Replica DB: Reads (API, Dashboard)

Supabase Pro+ תומך בזה
```

### 1000+ לקוחות - Enterprise

```
Supabase Enterprise: Custom pricing
- Dedicated Resources
- 99.95% SLA
- Priority Support

או

Self-hosted PostgreSQL + K8s
- Full control
- מורכב יותר
```

---

## 🎯 סיכום טכני

### מה בנוי ב-V1?

✅ **7 שכבות ארכיטקטורה מלאות**  
✅ **10 טבלאות DB + Indexes + RLS**  
✅ **12 API Endpoints מתועדים**  
✅ **4 Jobs מתוזמנים**  
✅ **Source Key Strategy (ללא Pixel)**  
✅ **WhatsApp Business API**  
✅ **Security: Auth + Encryption + Rate Limiting**  
✅ **Scalability: עד 500 לקוחות ללא שינויים**

### מה חסר (ל-V2)?

- Pixel לאתר (Browser Fingerprinting)
- ML/AI (V1 = Rules-based בלבד)
- חסימות אוטומטיות
- אינטגרציה ל-GA4
- Multi-account (Agencies)

---

## 📁 Project Structure

```
magenad/
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── google-ads.js
│   │   ├── profiles.js
│   │   ├── dashboard.js
│   │   └── admin.js
│   ├── jobs/
│   │   ├── ingest-clicks.js
│   │   ├── calculate-baseline.js
│   │   ├── run-detection.js
│   │   └── generate-monthly-report.js
│   ├── rules/
│   │   ├── DetectionRule.js (base class)
│   │   ├── A1-RapidRepeat.js
│   │   ├── A2-ShortWindow.js
│   │   ├── B1-AccountSpike.js
│   │   └── ...
│   ├── services/
│   │   ├── googleAds.js
│   │   ├── whatsapp.js
│   │   ├── supabase.js
│   │   └── detection.js
│   ├── utils/
│   │   ├── sourceKey.js
│   │   ├── quietIndex.js
│   │   └── dateUtils.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Detections.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── QuietIndex.jsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── useAuth.js
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_ad_accounts.sql
│   │   └── ...
│   └── config.toml
│
├── .env.example
├── README.md
└── package.json
```

---

## 🚀 הצעד הבא

**עכשיו** שיש לך את ה-Blueprint המלא:

1. ✅ תקרא את המסמך הזה בעיון
2. ✅ תשאל שאלות אם משהו לא ברור
3. ✅ אני אתן לך את המסמך השני: **DETECTION_RULES_FINAL** (החוקים המלאים)

---

**סיימת לקרוא? כתוב "הבנתי" או שאל שאלות!** 🎯
