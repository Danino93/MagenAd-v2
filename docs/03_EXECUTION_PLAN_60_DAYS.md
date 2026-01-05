# 🚀 MagenAd - תוכנית ביצוע 60 יום

**מיום 1 עד מוצר חי ומוכר**

---

## 📋 תוכן עניינים

1. [עקרונות התוכנית](#1-עקרונות-התוכנית)
2. [מבנה השבועות](#2-מבנה-השבועות)
3. [שבוע 1-2: Foundation](#3-שבוע-1-2-foundation)
4. [שבוע 3-4: Data & Detection](#4-שבוע-3-4-data--detection)
5. [שבוע 5-6: Dashboard & Reports](#5-שבוע-5-6-dashboard--reports)
6. [שבוע 7-8: Testing & Polish](#6-שבוע-7-8-testing--polish)
7. [שבוע 9: First Clients](#7-שבוע-9-first-clients)
8. [Cursor AI Prompts](#8-cursor-ai-prompts)
9. [Definition of Done](#9-definition-of-done)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. עקרונות התוכנית

### גישת העבודה

```
📦 בנה בבלוקים
   └─ כל שבוע = בלוק פונקציונלי שלם

🧪 טסט כל יום
   └─ אל תצבור באגים

✅ Definition of Done
   └─ לא עוברים לשלב הבא בלי לסיים

🤖 עבוד עם Cursor
   └─ השתמש ב-Prompts שאני נותן לך
```

### הכלל החשוב ביותר

**⚠️ אל תקפוץ קדימה!**

```
❌ לא בונים Dashboard לפני שיש API
❌ לא בונים Detection לפני שיש Data
❌ לא מוסיפים "רק עוד פיצ'ר קטן"
```

### איך לעבוד עם Cursor

```
1. קרא את ה-prompt המלא
2. העתק לCursor
3. תן לו לכתוב
4. בדוק שעובד
5. עבור לפרומפט הבא
```

---

## 2. מבנה השבועות

### Timeline Overview

```
Week 1-2: Foundation (14 ימים)
├─ Setup + Auth + Basic API
├─ Database + Supabase
└─ Google Ads OAuth

Week 3-4: Data & Detection (14 ימים)
├─ Data Ingestion Job
├─ Baseline Calculation
└─ Detection Engine

Week 5-6: Dashboard & Reports (14 ימים)
├─ React Dashboard
├─ Monthly Reports
└─ WhatsApp Integration

Week 7-8: Testing & Polish (14 ימים)
├─ Real Data Testing
├─ Bug Fixes
└─ UI/UX Polish

Week 9: Launch (4 ימים)
├─ First Client Onboarding
├─ Monitoring
└─ Iteration
```

### יעדים שבועיים

| שבוע | יעד | Success Metric |
|------|-----|----------------|
| 1-2 | תשתית מוכנה | יוזר יכול להירשם ולהתחבר לGoogle Ads |
| 3-4 | Data זורם | קליקים נשמרים ב-DB כל 6 שעות |
| 5-6 | Dashboard חי | יוזר רואה נתונים אמיתיים |
| 7-8 | יציב ומלוטש | אפס באגים קריטיים |
| 9 | לקוח ראשון | 1 לקוח משתמש במערכת |

---

## 3. שבוע 1-2: Foundation

### יום 1: Project Setup

**מטרה:** ליצור את מבנה הפרויקט הבסיסי.

**משימות:**

1. **צור תיקיות**
```bash
mkdir magenad
cd magenad
mkdir backend frontend
```

2. **Backend Setup**
```bash
cd backend
npm init -y
npm install express cors dotenv
npm install @supabase/supabase-js
npm install node-cron
npm install --save-dev nodemon
```

3. **Frontend Setup**
```bash
cd ../frontend
npm create vite@latest . -- --template react
npm install @supabase/supabase-js
npm install react-router-dom
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

4. **Git Init**
```bash
cd ..
git init
echo "node_modules" > .gitignore
echo ".env" >> .gitignore
git add .
git commit -m "Initial setup"
```

**Cursor Prompt:**
```
Create a basic Express server in backend/server.js with:
- CORS enabled
- JSON body parser
- A health check endpoint at GET /api/health
- Listen on port 3001
- Use ES6 import syntax

Also create backend/package.json scripts:
- "start": "node server.js"
- "dev": "nodemon server.js"
```

**Definition of Done:**
- ✅ `npm run dev` מריץ את השרת
- ✅ `http://localhost:3001/api/health` מחזיר `{ status: "ok" }`
- ✅ Frontend רץ עם `npm run dev`

---

### יום 2: Supabase Setup

**מטרה:** לחבר את Supabase ולהגדיר Auth.

**משימות:**

1. **צור Supabase Project**
   - לך ל-https://supabase.com
   - Create New Project
   - שמור: `SUPABASE_URL` + `SUPABASE_ANON_KEY`

2. **הוסף .env**
```bash
# backend/.env
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_KEY=your_service_key_here

# frontend/.env
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. **צור Supabase Client**

**Cursor Prompt:**
```
Create backend/services/supabase.js that exports a Supabase client using:
- @supabase/supabase-js
- Load SUPABASE_URL and SUPABASE_SERVICE_KEY from .env
- Use createClient with service role key

Also create frontend/src/lib/supabase.js that exports a client using:
- VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Use createClient for browser
```

**Definition of Done:**
- ✅ Supabase client מוגדר בשני הצדדים
- ✅ אין errors בקונסול
- ✅ `.env` ב-gitignore

---

### יום 3: Database Schema - Part 1

**מטרה:** ליצור את טבלאות המשתמשים והחשבונות.

**משימות:**

1. **פתח Supabase SQL Editor**

2. **הרץ SQL:**

```sql
-- טבלת users (מתחברת ל-auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- RLS Policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id);
```

3. **טבלת ad_accounts:**

```sql
CREATE TABLE ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_customer_id TEXT NOT NULL,
  account_name TEXT,
  
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  connection_status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_error_message TEXT,
  
  currency TEXT DEFAULT 'ILS',
  timezone TEXT DEFAULT 'Asia/Jerusalem',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, google_customer_id)
);

CREATE INDEX idx_ad_accounts_user ON ad_accounts(user_id);
CREATE INDEX idx_ad_accounts_customer_id ON ad_accounts(google_customer_id);
CREATE INDEX idx_ad_accounts_status ON ad_accounts(connection_status);

-- RLS
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
ON ad_accounts FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own accounts"
ON ad_accounts FOR INSERT
WITH CHECK (user_id = auth.uid());
```

**Definition of Done:**
- ✅ טבלאות נוצרו בהצלחה
- ✅ RLS פעיל
- ✅ אפשר לראות ב-Supabase Table Editor

---

### יום 4: Auth - Signup & Login

**מטרה:** משתמש יכול להירשם ולהתחבר.

**Cursor Prompt - Backend:**
```
Create backend/routes/auth.js with Express router:

POST /signup:
- Accepts: { email, password, full_name, phone }
- Uses supabase.auth.signUp()
- After signup, insert into users table
- Returns: { user, session }

POST /login:
- Accepts: { email, password }
- Uses supabase.auth.signInWithPassword()
- Updates users.last_login_at
- Returns: { user, session }

POST /logout:
- Requires Authorization header
- Uses supabase.auth.signOut()
- Returns: { success: true }

Mount this router in server.js at /api/auth
```

**Cursor Prompt - Frontend:**
```
Create frontend/src/pages/Login.jsx:
- Form with email + password fields
- "Login" and "Sign Up" buttons
- On submit, call supabase.auth.signInWithPassword()
- On success, navigate to /dashboard
- Show error messages if login fails
- Use Tailwind for styling (clean, minimal)

Also create frontend/src/pages/Signup.jsx with:
- Email, password, full name, phone fields
- Call supabase.auth.signUp()
- Redirect to dashboard on success

Create frontend/src/hooks/useAuth.js:
- Custom hook that checks supabase.auth.getSession()
- Returns { user, loading, signOut }
```

**Definition of Done:**
- ✅ אפשר להירשם במייל וסיסמה
- ✅ אפשר להתחבר
- ✅ Session נשמר (refresh עובד)
- ✅ אפשר להתנתק

---

### יום 5: Google Ads OAuth - Setup

**מטרה:** להתחיל את תהליך החיבור לGoogle Ads.

**משימות:**

1. **צור Google Cloud Project**
   - https://console.cloud.google.com
   - Create Project: "MagenAd"
   - Enable "Google Ads API"

2. **צור OAuth Credentials**
   - APIs & Services → Credentials
   - Create OAuth Client ID
   - Type: Web Application
   - Authorized redirect URIs: `http://localhost:3001/api/google-ads/callback`
   - שמור: `CLIENT_ID` + `CLIENT_SECRET`

3. **בקש Developer Token**
   - Google Ads → Tools → API Center
   - Apply for Developer Token
   - (לוקח 24-48 שעות - בינתיים השתמש ב-test token)

4. **הוסף ל-.env:**
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_DEVELOPER_TOKEN=your_dev_token
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google-ads/callback
```

**Cursor Prompt:**
```
Create backend/services/googleAds.js:

Export a function getAuthUrl(userId) that:
- Uses googleapis library (install it)
- Creates OAuth2 client with CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
- Generates auth URL with scopes: ['https://www.googleapis.com/auth/adwords']
- Includes state parameter with userId
- Returns the auth URL

Also create backend/routes/googleAds.js with:

GET /oauth-url:
- Requires auth (check Authorization header)
- Calls getAuthUrl(userId)
- Returns: { auth_url }

GET /callback:
- Receives code and state from query params
- Exchanges code for tokens using OAuth2 client
- Saves tokens to ad_accounts table
- Redirects to frontend with success message
```

**Definition of Done:**
- ✅ `GET /api/google-ads/oauth-url` מחזיר URL
- ✅ הURL פותח את Google OAuth
- ✅ Callback מקבל את הקוד

---

### יום 6: Google Ads OAuth - Complete

**מטרה:** לשמור את הטוקנים ולשלוף חשבונות.

**Cursor Prompt:**
```
Update backend/services/googleAds.js:

Add function getAccessToken(refreshToken):
- Uses OAuth2 client to refresh token
- Returns new access token

Add function listCustomerAccounts(refreshToken):
- Uses Google Ads API
- Fetches customer accounts accessible with this token
- Returns array of: { customer_id, name }

Update backend/routes/googleAds.js:

POST /connect-account:
- Requires auth
- Accepts: { customer_id, account_name }
- Saves to ad_accounts with user_id
- Returns: { ad_account }

GET /accounts:
- Requires auth
- Returns user's connected ad_accounts
```

**Frontend Prompt:**
```
Create frontend/src/pages/ConnectAccount.jsx:

- Shows "Connect Google Ads" button
- On click, fetch /api/google-ads/oauth-url
- Open URL in popup window
- After OAuth, show list of available accounts
- User selects account and clicks "Connect"
- POST to /api/google-ads/connect-account
- Redirect to dashboard
```

**Definition of Done:**
- ✅ OAuth flow מלא עובד
- ✅ טוקנים נשמרים ב-DB
- ✅ יוזר רואה רשימת חשבונות
- ✅ יוזר יכול לחבר חשבון

---

### יום 7: Database Schema - Part 2

**מטרה:** ליצור את שאר הטבלאות (profiles, raw_events, baseline, detections).

**SQL להרצה:**

```sql
-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  profile_type TEXT DEFAULT 'normal',
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
      "off_hours_percentage": 30
    },
    "cooldown_hours": 12
  }'::jsonb,
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
      "saturday": {"enabled": false}
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id)
);

CREATE INDEX idx_profiles_account ON profiles(ad_account_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profiles"
ON profiles FOR SELECT
USING (ad_account_id IN (
  SELECT id FROM ad_accounts WHERE user_id = auth.uid()
));

-- raw_events
CREATE TABLE raw_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  click_id TEXT,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  ad_group_id TEXT,
  ad_group_name TEXT,
  click_timestamp TIMESTAMPTZ NOT NULL,
  device_type TEXT,
  network TEXT,
  country TEXT,
  click_cost_micros BIGINT,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id, click_id, click_timestamp)
);

CREATE INDEX idx_raw_events_account ON raw_events(ad_account_id);
CREATE INDEX idx_raw_events_timestamp ON raw_events(click_timestamp);
CREATE INDEX idx_raw_events_campaign ON raw_events(campaign_id);

-- baseline_stats
CREATE TABLE baseline_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT,
  metric_type TEXT NOT NULL,
  period_days INTEGER NOT NULL,
  avg_value NUMERIC,
  std_dev NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  data_points INTEGER,
  UNIQUE(ad_account_id, campaign_id, metric_type, period_days)
);

CREATE INDEX idx_baseline_account ON baseline_stats(ad_account_id);

-- detection_state
CREATE TABLE detection_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  learning_mode BOOLEAN DEFAULT TRUE,
  learning_started_at TIMESTAMPTZ DEFAULT NOW(),
  baseline_ready_at TIMESTAMPTZ,
  days_with_data INTEGER DEFAULT 0,
  total_events_collected INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id)
);

-- detections
CREATE TABLE detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT,
  rule_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  time_window_start TIMESTAMPTZ NOT NULL,
  time_window_end TIMESTAMPTZ NOT NULL,
  evidence JSONB,
  action_decided TEXT,
  action_status TEXT DEFAULT 'pending',
  action_executed_at TIMESTAMPTZ,
  action_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id, rule_id, time_window_start, campaign_id)
);

CREATE INDEX idx_detections_account ON detections(ad_account_id);
CREATE INDEX idx_detections_created ON detections(created_at);

-- cooldown_tracker
CREATE TABLE cooldown_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  cooldown_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id, entity_type, entity_id, rule_id)
);

CREATE INDEX idx_cooldown_active ON cooldown_tracker(ad_account_id, cooldown_until)
WHERE cooldown_until > NOW();

-- monthly_reports
CREATE TABLE monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  report_month INTEGER NOT NULL,
  report_year INTEGER NOT NULL,
  total_clicks_checked INTEGER DEFAULT 0,
  suspicious_clicks INTEGER DEFAULT 0,
  actions_taken INTEGER DEFAULT 0,
  quiet_score INTEGER,
  quiet_status TEXT,
  system_active_days INTEGER,
  scans_performed INTEGER,
  report_data JSONB,
  sent_at TIMESTAMPTZ,
  sent_via TEXT,
  send_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id, report_year, report_month)
);

CREATE INDEX idx_reports_account ON monthly_reports(ad_account_id);
```

**Definition of Done:**
- ✅ כל הטבלאות נוצרו
- ✅ Indexes בסדר
- ✅ RLS policies פעילות

---

### יום 8-9: REST - תכנון ובדיקות

**מטרה:** להבין את מה שבנינו ולוודא שהכל עובד.

**משימות יום 8:**

1. **תעד את כל הAPI**
   - רשום את כל ה-endpoints שיש
   - בדוק עם Postman/Thunder Client

2. **בדוק Auth Flow**
   - נסה signup → login → logout
   - ודא ש-sessions עובדים

3. **בדוק Google Ads OAuth**
   - עבור את כל התהליך
   - ודא שהטוקנים נשמרים

**משימות יום 9:**

1. **כתוב README.md**
   - איך להריץ את הפרויקט
   - משתני סביבה נדרשים
   - API endpoints

2. **קצת Cleanup**
   - הסר console.log מיותרים
   - תקן הודעות שגיאה

**Definition of Done:**
- ✅ כל מה שבנינו עובד
- ✅ README מעודכן
- ✅ Git commit נקי

---

### יום 10: Dashboard - Basic UI

**מטרה:** להתחיל לבנות את הדשבורד.

**Cursor Prompt:**
```
Create frontend/src/pages/Dashboard.jsx:

Show:
- Navbar with user email and logout button
- Sidebar with navigation: Overview, Detections, Settings
- Main content area with "Welcome to MagenAd"
- List of connected ad accounts with status (active/expired)
- "Connect Account" button

Use React Router for navigation.
Use Tailwind for styling - clean, modern, blue/white theme.

Also create:
- frontend/src/components/Navbar.jsx
- frontend/src/components/Sidebar.jsx
- frontend/src/components/AccountCard.jsx (shows account info)
```

**Definition of Done:**
- ✅ Dashboard נראה טוב
- ✅ Navigation עובד
- ✅ רואים רשימת חשבונות

---

### יום 11-12: API Routes - Dashboard Data

**מטרה:** API endpoints לדשבורד.

**Cursor Prompt:**
```
Create backend/routes/dashboard.js:

GET /overview/:ad_account_id:
- Requires auth
- Check user owns this account
- Return:
  {
    connection_status: "active" | "expired" | "error",
    learning_mode: boolean,
    current_month: {
      clicks_checked: number,
      suspicious: number,
      actions: number,
      quiet_score: number,
      quiet_status: "quiet" | "normal" | "alert"
    },
    last_sync: timestamp,
    system_health: "ok" | "warning" | "error"
  }

GET /detections/:ad_account_id:
- Query params: from, to, severity, campaign_id
- Return paginated list of detections
- Include evidence and action details

Mount in server.js at /api/dashboard
```

**Frontend:**
```
Update frontend/src/pages/Dashboard.jsx:

When user selects an account:
- Fetch /api/dashboard/overview/:id
- Display:
  - Connection status badge
  - Learning mode notice (if true)
  - Stats: clicks checked, suspicious, actions
  - Quiet Index with color indicator
  - Last sync time
```

**Definition of Done:**
- ✅ Dashboard מציג נתונים אמיתיים (גם אם ריקים)
- ✅ אין errors
- ✅ Loading states עובדים

---

### יום 13-14: חוזרים על השבועיים

**מטרה:** לוודא שהכל יציב לפני שממשיכים.

**Checklist:**
- ✅ Auth עובד מעולה
- ✅ Google Ads OAuth עובד
- ✅ Database Schema מלא
- ✅ Dashboard בסיסי עובד
- ✅ API מתועד
- ✅ Git מעודכן

**אם יש בעיות - תקן אותן עכשיו!**

---

## 4. שבוע 3-4: Data & Detection

### יום 15: Google Ads API - First Call

**מטרה:** לשלוף קליקים אמיתיים מGoogle Ads.

**Cursor Prompt:**
```
Update backend/services/googleAds.js:

Add function fetchClicks(account, options):
- options: { from: Date, to: Date }
- Uses Google Ads API library
- Query:
  SELECT
    click_view.gclid,
    segments.date,
    segments.hour,
    segments.device,
    segments.click_type,
    campaign.id,
    campaign.name,
    ad_group.id,
    ad_group.name,
    metrics.clicks,
    metrics.cost_micros
  FROM click_view
  WHERE segments.date >= 'YYYY-MM-DD'
    AND segments.date <= 'YYYY-MM-DD'

- Transform to our format:
  {
    ad_account_id,
    click_id: gclid,
    campaign_id,
    campaign_name,
    ad_group_id,
    ad_group_name,
    click_timestamp: Date,
    device_type,
    network,
    country: 'IL', // derive from geo if available
    click_cost_micros
  }

- Return array of clicks
```

**Test:**
```
Create backend/scripts/test-fetch-clicks.js:
- Load one account from DB
- Call fetchClicks for last 7 days
- Console.log the results
- Run with: node scripts/test-fetch-clicks.js
```

**Definition of Done:**
- ✅ `fetchClicks()` מחזיר נתונים אמיתיים
- ✅ הפורמט תואם ל-raw_events
- ✅ אין crashes

---

### יום 16: Data Ingestion Job - Part 1

**מטרה:** Job שרץ אוטומטית ושולף clicks.

**Cursor Prompt:**
```
Create backend/jobs/ingest-clicks.js:

- Use node-cron to schedule: '0 */6 * * *' (every 6 hours)
- On trigger:
  1. Fetch all active ad_accounts
  2. For each account:
     a. Check if token is expired
     b. Refresh if needed
     c. Call fetchClicks(account, { from: 6 hours ago, to: now })
     d. Upsert to raw_events (use UNIQUE constraint for idempotency)
     e. Update ad_accounts.last_sync_at and last_sync_status
  3. Log summary: "Synced X accounts, Y clicks"

Handle errors:
- If account fails, log error and continue to next
- Save error message to ad_accounts.last_error_message

Export the cron job so server.js can import and start it.
```

**Update server.js:**
```javascript
// Add at end of server.js
require('./jobs/ingest-clicks');
console.log('✓ Ingestion job scheduled');
```

**Definition of Done:**
- ✅ Job רץ כל 6 שעות
- ✅ Clicks נשמרים ב-raw_events
- ✅ Idempotency עובד (אין duplicates)
- ✅ Errors מתועדים

---

### יום 17: Data Ingestion Job - Testing

**מטרה:** לוודא שהJob עובד מעולה.

**משימות:**

1. **הרץ ידנית:**
```bash
node backend/jobs/ingest-clicks.js
```

2. **בדוק ב-Supabase:**
   - Table Editor → raw_events
   - ודא שיש clicks

3. **בדוק Idempotency:**
   - הרץ פעמיים
   - ודא שאין duplicates

4. **בדוק Error Handling:**
   - נתק חשבון
   - ודא שJob לא קורס

**Definition of Done:**
- ✅ Job עובד ללא שגיאות
- ✅ Data נכון
- ✅ מוכן לייצור

---

### יום 18: Baseline Calculation Job

**מטרה:** לחשב baseline stats.

**Cursor Prompt:**
```
Create backend/jobs/calculate-baseline.js:

Schedule: '0 2 * * *' (2 AM daily)

Function calculateBaseline(accountId, periodDays = 14):

1. Query raw_events for last {periodDays} days
2. Calculate:
   - clicks_per_day: { avg, std_dev, min, max }
   - device_distribution: { mobile: %, desktop: %, tablet: % }
   - network_distribution: { search: %, display: % }
3. Upsert to baseline_stats

Function updateLearningMode(accountId):
- Check detection_state
- Count days_with_data (distinct dates in raw_events)
- Count total_events_collected
- If days >= 7 AND events >= 100:
  - Set learning_mode = false
  - Set baseline_ready_at = now

Export cron job.
```

**Definition of Done:**
- ✅ Baseline מחושב כל לילה
- ✅ Learning Mode מתעדכן אוטומטית
- ✅ ניתן לראות ב-baseline_stats

---

### יום 19: Source Key Utils

**מטרה:** פונקציות עזר ל-Source Key.

**Cursor Prompt:**
```
Create backend/utils/sourceKey.js:

Export functions:

generateSourceKey(click):
- Returns: "DEVICE::NETWORK::COUNTRY::CAMPAIGN_ID"
- Handle missing fields with "UNKNOWN"

parseSourceKey(key):
- Returns: { device_type, network, country, campaign_id }

groupBySourceKey(clicks):
- Returns: { sourceKey: [click, click, ...] }

filterByMinClicks(grouped, minClicks):
- Returns only sources with >= minClicks

All functions should have JSDoc comments.
```

**Test:**
```javascript
// backend/tests/sourceKey.test.js
const { generateSourceKey, groupBySourceKey } = require('../utils/sourceKey');

const testClicks = [
  { device_type: 'MOBILE', network: 'SEARCH', country: 'IL', campaign_id: '123', click_timestamp: '2025-01-01T10:00:00Z' },
  { device_type: 'MOBILE', network: 'SEARCH', country: 'IL', campaign_id: '123', click_timestamp: '2025-01-01T10:01:00Z' },
  { device_type: 'DESKTOP', network: 'SEARCH', country: 'IL', campaign_id: '123', click_timestamp: '2025-01-01T10:02:00Z' },
];

const grouped = groupBySourceKey(testClicks);
console.log(grouped);
// Should group first 2 together, third separate
```

**Definition of Done:**
- ✅ כל הפונקציות עובדות
- ✅ Test עובר
- ✅ מתועד

---

### יום 20: Detection Rule - A1 (Rapid Repeat)

**מטרה:** לבנות את החוק הראשון.

**Cursor Prompt:**
```
Create backend/rules/DetectionRule.js (base class):

class DetectionRule {
  constructor(id, name, severity) {
    this.id = id;
    this.name = name;
    this.severity = severity;
    this.supabase = require('../services/supabase');
  }
  
  async detect(account, timeWindow) {
    throw new Error('Must implement detect()');
  }
}

module.exports = DetectionRule;

---

Create backend/rules/A1-RapidRepeat.js:

Extend DetectionRule.
Implement detect(account):
- Fetch clicks from last 60 minutes
- Group by Source Key
- For each source, sliding window:
  - Check if >= threshold clicks in window_minutes
  - If yes, check cooldown
  - If not in cooldown, create detection
  - Set cooldown
- Return array of detections

Use thresholds from account.profiles.thresholds.frequency
```

**Definition of Done:**
- ✅ חוק A1 עובד
- ✅ מזהה חריגות אמיתיות
- ✅ Cooldown עובד

---

### יום 21-22: More Detection Rules

**מטרה:** לבנות עוד 3-4 חוקים.

**משימות יום 21:**
- A2 (Short Window Repeat)
- A3 (Daily Repeat Source)

**משימות יום 22:**
- B1 (Account Spike)
- B2 (Campaign Spike)

**Cursor Prompt (תבנית):**
```
Create backend/rules/{RULE_ID}-{Name}.js:

Extend DetectionRule.
Rule ID: {RULE_ID}
Rule Name: {Name}
Severity: {Severity}

Logic:
{describe the logic}

Use thresholds from account.profiles.thresholds.{category}

Return detections in format:
{
  rule_id,
  rule_name,
  severity,
  time_window_start,
  time_window_end,
  campaign_id,
  evidence: { ... },
  action_decided: 'report' | 'mark'
}
```

**Definition of Done:**
- ✅ 5 חוקים עובדים
- ✅ כל חוק נבדק בנפרד

---

### יום 23: Detection Engine Runner

**מטרה:** Job שמריץ את כל החוקים.

**Cursor Prompt:**
```
Create backend/jobs/run-detection.js:

Schedule: '0 * * * *' (hourly)

Import all rules:
- A1_RapidRepeat
- A2_ShortWindow
- A3_DailyRepeat
- B1_AccountSpike
- B2_CampaignSpike

const RULES = [new A1_RapidRepeat(), ...];

On trigger:
1. Fetch active accounts with profiles and detection_state
2. Filter out accounts in learning_mode
3. For each account:
   - For each rule:
     - Try: detections = await rule.detect(account)
     - Catch: log error, continue
     - If detections.length > 0:
       - Save to detections table
       - Log: "Rule {id} found {count} detections"

Function saveDetections(accountId, detections):
- Insert into detections table
- Set action_status = 'pending'

Export cron job.
```

**Definition of Done:**
- ✅ Detection Engine רץ כל שעה
- ✅ כל החוקים מופעלים
- ✅ Detections נשמרים ב-DB

---

### יום 24-25: Testing Detection Engine

**מטרה:** לוודא שהDetection Engine עובד מעולה.

**משימות יום 24:**

1. **צור Test Data**
```sql
-- Insert fake clicks for testing
INSERT INTO raw_events (ad_account_id, campaign_id, click_id, click_timestamp, device_type, network, country)
VALUES
  ('account-uuid', '123', 'click1', NOW() - INTERVAL '1 minute', 'MOBILE', 'SEARCH', 'IL'),
  ('account-uuid', '123', 'click2', NOW() - INTERVAL '30 seconds', 'MOBILE', 'SEARCH', 'IL'),
  ('account-uuid', '123', 'click3', NOW(), 'MOBILE', 'SEARCH', 'IL');
```

2. **הרץ Detection**
```bash
node backend/jobs/run-detection.js
```

3. **בדוק detections**
```sql
SELECT * FROM detections WHERE ad_account_id = 'account-uuid';
```

**משימות יום 25:**

1. **בדוק Cooldown**
   - הרץ שוב
   - ודא שלא יוצר duplicate detection

2. **בדוק Baseline Dependency**
   - חשבון עם/בלי baseline
   - ודא שחוקי Burst עובדים נכון

3. **בדוק Learning Mode**
   - חשבון ב-Learning Mode
   - ודא שלא מריץ detection

**Definition of Done:**
- ✅ Detection Engine יציב
- ✅ אין false positives מטורפים
- ✅ מוכן לייצור

---

### יום 26-28: שאר החוקים

**מטרה:** לסיים את כל 12 החוקים.

**יום 26:**
- B3 (Micro-Burst)
- C1 (Off-Hours)

**יום 27:**
- C2 (Night Burst)
- D1 (Network Shift)

**יום 28:**
- E1 (Multi-Rule Confirmation)
- E2 (Suspicious Score)
- F1 (Rate Limit)

**Cursor Prompt לכל חוק:**
```
Create backend/rules/{ID}-{Name}.js following the pattern from A1.

[Include specific logic from the Detection Rules document]

Test with realistic data.
```

**Definition of Done:**
- ✅ כל 12 החוקים עובדים
- ✅ נבדקו עם נתונים אמיתיים
- ✅ Cooldowns + Rate Limiting עובדים

---

## 5. שבוע 5-6: Dashboard & Reports

### יום 29: Quiet Index Calculator

**מטרה:** לחשב את מדד השקט.

**Cursor Prompt:**
```
Create backend/utils/quietIndex.js:

Export functions:

calculateQuietIndex(detections):
- Start with score = 100
- For each detection:
  - If severity === 'high': score -= 10
  - If severity === 'medium': score -= 5
  - If severity === 'low': score -= 2
- Return Math.max(0, Math.min(100, score))

getQuietStatus(score):
- If score >= 80: return 'quiet'
- If score >= 50: return 'normal'
- Return 'alert'

getQuietEmoji(status):
- quiet: '🟢'
- normal: '🟡'
- alert: '🔴'

getQuietMessage(score, status):
- Return Hebrew message based on status
```

**Test:**
```javascript
const detections = [
  { severity: 'high' },
  { severity: 'medium' },
  { severity: 'medium' }
];

const score = calculateQuietIndex(detections); // 100 - 10 - 5 - 5 = 80
const status = getQuietStatus(score); // 'quiet'
console.log(`${getQuietEmoji(status)} ${score} - ${getQuietMessage(score, status)}`);
```

**Definition of Done:**
- ✅ Quiet Index עובד
- ✅ הודעות בעברית
- ✅ מתועד

---

### יום 30: Dashboard - Overview Page

**מטרה:** דף Overview מלא עם נתונים אמיתיים.

**Cursor Prompt:**
```
Update frontend/src/pages/Dashboard.jsx:

Fetch /api/dashboard/overview/:accountId

Display:

1. Connection Status Badge:
   - Green: "מחובר ופעיל"
   - Yellow: "טוקן פג תוקף"
   - Red: "שגיאה בחיבור"

2. Learning Mode Notice (if true):
   - Blue info box: "המערכת לומדת את הדפוסים שלך - עוד X ימים"

3. Stats Cards (3 cards in a row):
   Card 1: נבדקו
   - Big number: {clicks_checked}
   - Label: "קליקים נבדקו החודש"
   
   Card 2: חשודים
   - Big number: {suspicious}
   - Label: "קליקים חשודים"
   
   Card 3: פעולות
   - Big number: {actions}
   - Label: "פעולות שבוצעו"

4. Quiet Index (large, centered):
   - Circle with color (green/yellow/red)
   - Score: {quiet_score}/100
   - Status emoji + text

5. Last Sync:
   - Small text: "עדכון אחרון: {last_sync}"

Use Tailwind, make it beautiful and clean.
```

**Definition of Done:**
- ✅ Overview נראה מעולה
- ✅ נתונים אמיתיים
- ✅ Responsive (mobile תומך)

---

### יום 31: Dashboard - Detections Page

**מטרה:** עמוד שמראה את כל הDetections.

**Cursor Prompt:**
```
Create frontend/src/pages/Detections.jsx:

Fetch /api/dashboard/detections/:accountId with filters:
- from/to dates (date picker)
- severity (dropdown: all, high, medium, low)
- campaign_id (dropdown from campaigns)

Display as table:
| תאריך | קמפיין | חוק | חומרה | פעולה | סטטוס |
|-------|--------|-----|--------|-------|--------|
| ...   | ...    | ... | ...    | ...   | ...    |

Each row expandable to show evidence details.

Pagination: 20 per page.

Use Tailwind table styling.
```

**Definition of Done:**
- ✅ טבלה עובדת
- ✅ פילטרים עובדים
- ✅ Pagination עובד

---

### יום 32: Dashboard - Settings Page

**מטרה:** דף הגדרות - שינוי פרופיל וthresholds.

**Cursor Prompt:**
```
Create frontend/src/pages/Settings.jsx:

Fetch /api/profiles/:accountId

Display:

1. Profile Selector:
   - Radio buttons: Easy, Normal (מומלץ), Aggressive
   - On change: PUT /api/profiles/:accountId with { profile_type }

2. Custom Thresholds (only if profile === 'custom'):
   - Show editable inputs for key thresholds
   - Save button

3. Business Hours:
   - Toggle for each day
   - Start/End time pickers
   - Save button

4. Reset Button:
   - "חזור להגדרות המומלצות"
   - POST /api/profiles/:accountId/reset

Use form validation.
Show success/error messages.
```

**Backend:**
```
Create/update backend/routes/profiles.js:

GET /profiles/:ad_account_id:
- Return profile with thresholds

PUT /profiles/:ad_account_id:
- Update profile_type or thresholds
- Log to audit_log

POST /profiles/:ad_account_id/reset:
- Reset to default 'normal' profile
```

**Definition of Done:**
- ✅ הגדרות עובדות
- ✅ שינויים נשמרים
- ✅ Reset עובד

---

### יום 33: Monthly Report Generator

**מטרה:** Job שיוצר דוח חודשי.

**Cursor Prompt:**
```
Create backend/jobs/generate-monthly-report.js:

Schedule: '5 0 1 * *' (1st of month at 00:05)

Function generateReport(accountId, year, month):

1. Get date range (last month)
2. Count total clicks from raw_events
3. Count detections (suspicious clicks)
4. Count actions (where action_status = 'success')
5. Calculate Quiet Index from detections
6. Calculate system stats:
   - days_with_data
   - scans_performed (estimate: days * 4)

7. Get top campaigns with most detections

8. Insert to monthly_reports:
   {
     ad_account_id,
     report_year,
     report_month,
     total_clicks_checked,
     suspicious_clicks,
     actions_taken,
     quiet_score,
     quiet_status,
     system_active_days,
     scans_performed,
     report_data: { top_campaigns, ... },
     send_status: 'pending'
   }

9. Return report

Export cron job.
```

**Definition of Done:**
- ✅ Report נוצר אוטומטית
- ✅ נתונים נכונים
- ✅ נשמר ב-DB

---

### יום 34: WhatsApp Business API Setup

**מטרה:** להגדיר WhatsApp Business.

**משימות:**

1. **צור Facebook Business Account**
   - https://business.facebook.com

2. **צור WhatsApp Business Account**
   - דרך Meta Business Suite

3. **קבל Phone Number ID + Access Token**
   - WhatsApp Manager → Settings

4. **הוסף ל-.env:**
```
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

5. **צור Template (אופציונלי ל-V1)**
   - WhatsApp Manager → Message Templates
   - שם: `monthly_report`
   - קטגוריה: `UTILITY`

**Definition of Done:**
- ✅ WhatsApp Business מוגדר
- ✅ יש Phone Number ID + Token
- ✅ אפשר לשלוח הודעה (test)

---

### יום 35: WhatsApp Integration

**מטרה:** לשלוח דוח בWhatsApp.

**Cursor Prompt:**
```
Create backend/services/whatsapp.js:

const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }
  
  async sendMonthlyReport(recipient, report) {
    const message = this.formatMessage(report);
    
    const response = await axios.post(
      this.apiUrl,
      {
        messaging_product: 'whatsapp',
        to: recipient, // +972501234567 format
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  }
  
  formatMessage(report) {
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

**Update generate-monthly-report.js:**
```javascript
// After creating report:
const whatsapp = require('../services/whatsapp');
const { data: user } = await supabase
  .from('users')
  .select('whatsapp_number')
  .eq('id', account.user_id)
  .single();

if (user.whatsapp_number) {
  await whatsapp.sendMonthlyReport(user.whatsapp_number, report);
  
  await supabase
    .from('monthly_reports')
    .update({
      sent_at: new Date(),
      sent_via: 'whatsapp',
      send_status: 'sent'
    })
    .eq('id', reportId);
}
```

**Definition of Done:**
- ✅ הודעת WhatsApp נשלחת
- ✅ הפורמט יפה וקריא
- ✅ Status מתעדכן ב-DB

---

### יום 36-37: Reports Page

**מטרה:** עמוד דוחות חודשיים.

**Cursor Prompt:**
```
Create frontend/src/pages/Reports.jsx:

Fetch /api/reports/:accountId (all monthly reports)

Display:
- List of months (cards)
- Each card shows:
  - Month/Year
  - Quiet Index (big, with color)
  - Key stats
  - "View Full Report" button

On click:
- Modal/page with full report details
- Top campaigns
- Severity breakdown
- Download PDF button (optional V2)
```

**Backend:**
```
Create backend/routes/reports.js:

GET /reports/:ad_account_id:
- Return all monthly_reports for this account
- Order by year/month DESC

GET /reports/:ad_account_id/:year/:month:
- Return specific report with full details
```

**Definition of Done:**
- ✅ דוחות מוצגים
- ✅ ניתן לראות דוח מלא
- ✅ UI נקי

---

### יום 38-42: Polish & UX

**מטרה:** לשפר את ה-UI/UX.

**משימות:**

**יום 38:**
- Loading skeletons
- Error boundaries
- Empty states ("אין נתונים עדיין")

**יום 39:**
- Responsive mobile
- Touch-friendly buttons
- Mobile menu

**יום 40:**
- Hebrew RTL support
- תרגום כל הטקסטים לעברית
- תיקון alignment

**יום 41:**
- Animations (subtle)
- Transitions בין עמודים
- Micro-interactions

**יום 42:**
- Accessibility
- Keyboard navigation
- Screen reader support (בסיסי)

**Definition of Done:**
- ✅ המערכת נראית מקצועית
- ✅ חוויית משתמש מעולה
- ✅ מוכן להצגה ללקוחות

---

## 6. שבוע 7-8: Testing & Polish

### יום 43-45: Real Data Testing

**מטרה:** לבדוק עם נתונים אמיתיים.

**משימות יום 43:**

1. **חבר את החשבון שלך (אינסטלציה)**
2. **הרץ את כל הJobs ידנית:**
```bash
node backend/jobs/ingest-clicks.js
node backend/jobs/calculate-baseline.js
node backend/jobs/run-detection.js
```
3. **בדוק שהכל עובד**

**משימות יום 44:**

1. **חכה 24 שעות** (תן למערכת לצבור נתונים)
2. **בדוק Dashboard:**
   - האם הנתונים נכונים?
   - האם Baseline מחושב?
   - האם יש detections?

**משימות יום 45:**

1. **בדוק Edge Cases:**
   - חשבון בלי קליקים
   - חשבון עם הרבה קליקים
   - חשבון עם טוקן שפג

2. **תקן באגים שמצאת**

**Definition of Done:**
- ✅ המערכת עובדת עם נתונים אמיתיים
- ✅ אין באגים קריטיים
- ✅ Baseline + Detection + Reports - הכל עובד

---

### יום 46-48: Bug Hunting

**מטרה:** למצוא ולתקן באגים.

**Checklist:**

**Auth & Security:**
- ✅ Session timeout עובד?
- ✅ Refresh token עובד?
- ✅ RLS מונע גישה לא מורשית?

**Data Flow:**
- ✅ Ingestion לא יוצר duplicates?
- ✅ Baseline מתעדכן נכון?
- ✅ Detection לא רץ בLearning Mode?

**Dashboard:**
- ✅ נתונים עדכניים?
- ✅ Filters עובדים?
- ✅ Pagination נכון?

**Jobs:**
- ✅ Cron jobs רצים בזמן?
- ✅ Error handling עובד?
- ✅ Logs ברורים?

**Definition of Done:**
- ✅ כל הבאגים תוקנו
- ✅ המערכת יציבה
- ✅ מוכן ללקוחות

---

### יום 49-50: Performance

**מטרה:** לוודא שהמערכת מהירה.

**משימות:**

1. **Database Indexes:**
```sql
-- Verify all indexes exist
\d+ raw_events
\d+ detections
\d+ baseline_stats
```

2. **Query Optimization:**
   - הרץ EXPLAIN ANALYZE על queries כבדים
   - תקן queries איטיים

3. **Frontend Performance:**
   - Lazy loading לעמודים
   - Pagination בטבלאות
   - Debounce על filters

4. **Caching (optional):**
   - Cache baseline stats (1 hour TTL)
   - Cache dashboard overview (5 minutes TTL)

**Definition of Done:**
- ✅ Dashboard נטען ב-< 2 שניות
- ✅ API responses ב-< 500ms
- ✅ אין queries איטיים

---

### יום 51-53: Error Handling & Monitoring

**מטרה:** לוודא שהמערכת מדווחת על בעיות.

**משימות יום 51:**

1. **Logging System:**
```javascript
// backend/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

module.exports = logger;
```

2. **Replace console.log with logger:**
```javascript
logger.info('Job started');
logger.error('Job failed', { error });
```

**משימות יום 52:**

1. **Health Check Endpoint:**
```javascript
// GET /api/health
{
  status: 'ok',
  timestamp: Date,
  services: {
    database: 'ok',
    google_ads: 'ok',
    whatsapp: 'ok'
  },
  jobs: {
    last_ingestion: timestamp,
    last_detection: timestamp,
    last_baseline: timestamp
  }
}
```

2. **Error Notifications (simple):**
```javascript
// אם Job נכשל > 3 פעמים ברציפות → Email לך
```

**משימות יום 53:**

1. **Frontend Error Boundaries**
2. **Toast Notifications לUser**
3. **Retry Logic על API calls**

**Definition of Done:**
- ✅ Logging מקיף
- ✅ Health check עובד
- ✅ Errors מטופלים יפה

---

### יום 54-56: Documentation

**מטרה:** לתעד את המערכת.

**משימות יום 54:**

1. **README.md מעודכן:**
   - Setup instructions
   - Environment variables
   - How to run
   - Project structure

2. **API Documentation:**
   - כל ה-endpoints
   - Request/Response examples
   - Error codes

**משימות יום 55:**

1. **User Guide (בעברית):**
   - איך להירשם
   - איך לחבר חשבון
   - איך להבין את הדשבורד
   - איך לשנות הגדרות

**משימות יום 56:**

1. **Admin Guide:**
   - איך להריץ jobs ידנית
   - איך לבדוק logs
   - איך לטפל בבעיות נפוצות

**Definition of Done:**
- ✅ כל התיעוד מוכן
- ✅ ניתן להעביר למפתח אחר
- ✅ ניתן לתת ללקוח

---

## 7. שבוע 9: First Clients

### יום 57: Launch Prep

**מטרה:** הכנה אחרונה ללקוחות.

**Checklist:**

**Technical:**
- ✅ Production environment מוכן (Vercel/Railway)
- ✅ Database backups פעילים
- ✅ SSL certificates תקינים
- ✅ Domain name מוגדר (app.magenad.com)

**Legal/Compliance:**
- ✅ Privacy Policy זמין
- ✅ Terms of Service זמינים
- ✅ הסכם לקוח מוכן

**Support:**
- ✅ Email support מוכן (support@magenad.com)
- ✅ WhatsApp support מוכן
- ✅ FAQ document

**Definition of Done:**
- ✅ הכל מוכן ללקוח ראשון

---

### יום 58: First Client Onboarding

**מטרה:** לקוח ראשון משתמש במערכת.

**תהליך:**

1. **הזמן לקוח פוטנציאלי** (בן משפחה/חבר/לקוח אמיתי)

2. **Onboarding Call (30 דקות):**
   - הסבר מה המערכת עושה
   - הראה Dashboard
   - עזור להירשם ולחבר חשבון

3. **Follow-up (24 שעות אחרי):**
   - שאל אם הכל עובד
   - בדוק שהנתונים זורמים

4. **איסוף Feedback:**
   - מה עבד טוב?
   - מה מבלבל?
   - מה חסר?

**Definition of Done:**
- ✅ לקוח ראשון פעיל
- ✅ Feedback נאסף
- ✅ אין בעיות קריטיות

---

### יום 59: Iteration

**מטרה:** תיקונים לפי feedback.

**משימות:**

1. **סקור את הFeedback**
2. **תעדף תיקונים:**
   - Blocker (מונע שימוש) → תקן מיד
   - Important (מפריע) → תקן היום
   - Nice to have → רשום ל-V2

3. **תקן את מה שדחוף**

**Definition of Done:**
- ✅ Blockers תוקנו
- ✅ לקוח מרוצה

---

### יום 60: Celebrate & Plan V2

**מטרה:** לחגוג ולתכנן הלאה!

**משימות:**

1. **🎉 חגוג!**
   - V1 חי ועובד!
   - יש לקוח ראשון!

2. **V2 Planning:**
   - רשום רעיונות ל-V2
   - תעדף לפי חשיבות
   - תכנן timeline

3. **Marketing:**
   - צור landing page
   - הכן demo video
   - התחל לשווק ברצינות

**Definition of Done:**
- ✅ V1 מושלם ופועל
- ✅ יש תוכנית ל-V2
- ✅ מוכן למכור!

---

## 8. Cursor AI Prompts

### טיפים לעבודה עם Cursor

**1. תמיד תתחיל עם Context:**
```
I'm building a click fraud detection system called MagenAd.
Stack: Node.js + Express + React + Supabase.

[Your specific request]
```

**2. תהיה ספציפי:**
```
❌ "Create an API for users"
✅ "Create a POST /api/users endpoint that:
   - Accepts: { email, password, full_name }
   - Validates email format
   - Hashes password with bcrypt
   - Inserts to Supabase users table
   - Returns: { user, token }"
```

**3. בקש דוגמאות:**
```
Create this function AND show me an example of how to use it.
```

**4. דרוש Error Handling:**
```
Add try/catch blocks and return meaningful error messages.
```

**5. בקש Comments:**
```
Add JSDoc comments to all functions.
```

---

### Template Prompts

**Backend API Endpoint:**
```
Create a [GET/POST/PUT/DELETE] endpoint at /api/[path].

Requirements:
- Input: [describe]
- Validation: [describe]
- Database: [table/operation]
- Output: [describe]
- Error handling: [cases]
- Authorization: [yes/no]

Add JSDoc comments and example usage.
```

**Frontend Component:**
```
Create a React component [ComponentName] that:

Features:
- [feature 1]
- [feature 2]

Props:
- [prop1]: [type] - [description]

State:
- [state1]: [type] - [description]

Styling: Use Tailwind CSS with [color scheme/style]

Handle loading and error states.
```

**Database Query:**
```
Write a Supabase query that:
- Table: [table_name]
- Operation: [select/insert/update/delete]
- Filters: [describe]
- Joins: [if needed]
- Returns: [describe]

Include error handling.
```

**Job/Cron:**
```
Create a scheduled job that runs [frequency].

Tasks:
1. [step 1]
2. [step 2]
3. [step 3]

Error handling:
- If [error] → [action]

Logging:
- Log start/end
- Log errors with context

Use node-cron for scheduling.
```

---

## 9. Definition of Done

### Global Definition of Done

**כל feature חייב לעבור:**

✅ **Works:** הפיצ'ר עובד כמו שצריך  
✅ **Tested:** נבדק ידנית לפחות 3 פעמים  
✅ **Error Handling:** טיפול בשגיאות  
✅ **Logged:** Events מתועדים  
✅ **Documented:** יש comment/readme  
✅ **Committed:** Git commit עם הודעה ברורה  

---

### Per-Phase Definition of Done

**Week 1-2 (Foundation):**
- ✅ User יכול להירשם ולהתחבר
- ✅ User יכול לחבר Google Ads account
- ✅ Tokens נשמרים מוצפנים
- ✅ Database Schema מלא
- ✅ Basic Dashboard מוצג

**Week 3-4 (Data & Detection):**
- ✅ Clicks נאספים כל 6 שעות
- ✅ Baseline מחושב יומית
- ✅ 12 Detection Rules עובדים
- ✅ Detections נשמרים ב-DB
- ✅ Cooldown + Rate Limiting עובד

**Week 5-6 (Dashboard & Reports):**
- ✅ Dashboard מציג נתונים אמיתיים
- ✅ Quiet Index מחושב נכון
- ✅ Monthly Report נוצר אוטומטית
- ✅ WhatsApp נשלח בהצלחה
- ✅ Settings עובדות

**Week 7-8 (Testing):**
- ✅ אפס באגים קריטיים
- ✅ Performance טוב (< 2s load)
- ✅ Errors מטופלים נכון
- ✅ Logging מקיף
- ✅ Documentation מלא

**Week 9 (Launch):**
- ✅ לקוח ראשון פעיל
- ✅ Feedback נאסף
- ✅ Production stable
- ✅ Support system פעיל

---

## 10. Troubleshooting

### בעיות נפוצות ופתרונות

**בעיה: Google Ads API מחזיר 401 Unauthorized**
```
פתרון:
1. בדוק שה-Developer Token נכון
2. בדוק שהRefresh Token לא פג
3. רענן את הToken:
   const newToken = await getAccessToken(refreshToken);
4. אם עדיין לא עובד - בקש מהלקוח לחבר מחדש
```

**בעיה: Supabase RLS מונע גישה**
```
פתרון:
1. בדוק שיש Authorization header
2. בדוק את הPolicy:
   SELECT * FROM policies WHERE tablename = 'your_table';
3. אם Policy חסר - הוסף:
   CREATE POLICY "Policy name" ON table FOR SELECT USING (condition);
```

**בעיה: Jobs לא רצים**
```
פתרון:
1. בדוק שהשרת רץ:
   pm2 status (if using PM2)
2. בדוק logs:
   tail -f combined.log
3. הרץ ידנית לבדיקה:
   node backend/jobs/ingest-clicks.js
```

**בעיה: Dashboard לא מציג נתונים**
```
פתרון:
1. פתח Console → Network
2. בדוק את ה-API call
3. אם 401 → Token פג, רענן session
4. אם 403 → RLS issue
5. אם 404 → בדוק route
6. אם 500 → בדוק Backend logs
```

**בעיה: Baseline לא מחושב**
```
פתרון:
1. בדוק שיש מספיק נתונים (7 ימים + 100 events)
2. הרץ calculate-baseline ידנית
3. בדוק detection_state:
   SELECT * FROM detection_state WHERE ad_account_id = 'uuid';
4. אם learning_mode = true → חכה עוד ימים
```

**בעיה: WhatsApp לא נשלח**
```
פתרון:
1. בדוק שמספר הטלפון בפורמט +972...
2. בדוק שהAccess Token תקף
3. בדוק ב-Meta Business Suite → WhatsApp Manager → Insights
4. נסה לשלוח הודעה ידנית דרך WhatsApp Manager
```

---

## 🎯 סיכום תוכנית ה-60 יום

### מה בנינו?

✅ **Week 1-2:** תשתית מלאה (Auth + DB + OAuth)  
✅ **Week 3-4:** Data Flow + Detection Engine  
✅ **Week 5-6:** Dashboard + Reports + WhatsApp  
✅ **Week 7-8:** Testing + Polish + Performance  
✅ **Week 9:** First Client + Launch  

### הצעד הבא?

**אחרי שיש לך את 4 המסמכים:**
1. קרא הכל בעיון
2. שאל שאלות
3. **תתחיל ביום 1!**

---

## 📞 **תמיכה ולווי**

**בכל שלב:**
- כתוב לי "יום X" → אני מלווה אותך
- שאל שאלות → אני עונה מיד
- תקוע? → אני עוזר לפתור

**אני איתך עד הסוף!** 🚀

---

**זה זה! המסמך השלישי מוכן!**

תכתוב **"הבא"** למסמך 4 (האחרון), או שאל שאלות! 💪
