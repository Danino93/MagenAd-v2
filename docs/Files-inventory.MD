# 📁 FILES INVENTORY - כל הקבצים שיצרנו

**Last Updated:** יום 6 (05/01/2026)

---

## 🔧 **BACKEND FILES**

### **📂 backend/config/**
```
supabase.js
  ├─ חיבור ל-Supabase
  ├─ @supabase/supabase-js
  └─ exports: supabase client
```

---

### **📂 backend/services/**

```
GoogleAdsService.js (יום 4)
  ├─ שליפת campaigns מGoogle Ads API
  ├─ OAuth flow management
  ├─ Customer management
  └─ Functions:
      ├─ getCampaigns(customerId, refreshToken)
      ├─ getCustomers(refreshToken)
      └─ refreshAccessToken(refreshToken)

ClicksService.js (יום 5)
  ├─ שליפת clicks מGoogle Ads
  ├─ עיבוד וניתוח clicks
  ├─ שמירה ב-raw_events
  └─ Functions:
      ├─ getClicks(customerId, refreshToken, options)
      ├─ processClick(click, customerId)
      ├─ saveClicks(accountId, clicks)
      ├─ syncClicks(accountId, customerId, refreshToken)
      ├─ getClicksFromDB(accountId, options)
      └─ getClickStats(accountId, days)

DetectionEngine.js (יום 6)
  ├─ מנוע זיהוי הונאות
  ├─ 3 רמות: liberal, balanced, aggressive
  ├─ 8 כללי זיהוי
  └─ Functions:
      ├─ detectFraud(click, accountId, preset)
      ├─ checkSameIPClicks()
      ├─ checkRapidFireClicks()
      ├─ checkImpossibleGeography()
      ├─ checkCostSpike()
      ├─ checkDeviceSwitching()
      ├─ checkWeekendSurge()
      ├─ checkNightActivity()
      ├─ calculateFraudScore(detections)
      ├─ saveDetection(detection, clickId, accountId)
      ├─ getPreset(presetName)
      └─ getAllPresets()
```

---

### **📂 backend/routes/**

```
auth.js (יום 3)
  ├─ POST /api/auth/google - Google OAuth
  ├─ POST /api/auth/register - Registration
  ├─ POST /api/auth/login - Login
  └─ JWT token generation

googleads.js (יום 4)
  ├─ GET /api/googleads/accounts - רשימת חשבונות
  ├─ POST /api/googleads/connect - חיבור OAuth
  ├─ GET /api/googleads/callback - OAuth callback
  ├─ GET /api/googleads/campaigns/:accountId - Campaigns
  └─ POST /api/googleads/disconnect/:accountId - ניתוק

clicks.js (יום 5)
  ├─ GET /api/clicks/:accountId - Get clicks
  ├─ POST /api/clicks/:accountId/sync - Sync מGoogle Ads
  ├─ GET /api/clicks/:accountId/stats - סטטיסטיקות
  ├─ GET /api/clicks/:accountId/recent - Clicks אחרונים
  └─ GET /api/clicks/:accountId/campaigns - לפי campaign

detection.js (יום 6)
  ├─ GET /api/detection/presets - 3 רמות
  ├─ POST /api/detection/:accountId/analyze - ניתוח
  ├─ GET /api/detection/:accountId/alerts - התראות
  ├─ GET /api/detection/:accountId/stats - סטטיסטיקות
  ├─ PUT /api/detection/:accountId/settings - עדכון רמה
  └─ DELETE /api/detection/:accountId/alerts/:alertId - מחיקה
```

---

### **📂 backend/ (root files)**

```
server.js
  ├─ Express server
  ├─ Port 3001
  ├─ CORS enabled
  ├─ Routes:
  │   ├─ /api/auth
  │   ├─ /api/googleads
  │   ├─ /api/clicks
  │   └─ /api/detection
  └─ Health check: /api/health

.env.local
  ├─ SUPABASE_URL
  ├─ SUPABASE_KEY
  ├─ JWT_SECRET
  ├─ GOOGLE_CLIENT_ID
  ├─ GOOGLE_CLIENT_SECRET
  ├─ GOOGLE_ADS_CLIENT_ID
  ├─ GOOGLE_ADS_CLIENT_SECRET
  ├─ GOOGLE_ADS_DEVELOPER_TOKEN
  └─ GOOGLE_ADS_LOGIN_CUSTOMER_ID

package.json
  ├─ Dependencies:
  │   ├─ express
  │   ├─ cors
  │   ├─ dotenv
  │   ├─ jsonwebtoken
  │   ├─ bcryptjs
  │   ├─ @supabase/supabase-js
  │   └─ google-ads-api
  └─ Scripts:
      ├─ npm start
      └─ npm run dev (nodemon)
```

---

## 🎨 **FRONTEND FILES**

### **📂 frontend/src/pages/**

```
LoginPage.jsx (יום 3)
  ├─ עמוד התחברות
  ├─ Google OAuth button
  ├─ Dark theme
  └─ Redirects to /app/dashboard

DashboardHebrew.jsx (יום 3)
  ├─ Dashboard ראשי
  ├─ RTL Hebrew
  ├─ Stats cards
  ├─ Integrations:
  │   ├─ LiveClicksFeed
  │   ├─ DetectionSettings
  │   └─ FraudAlertsPanel
  └─ State:
      └─ connectedAccountId

ConnectAdsPage.jsx (יום 4)
  ├─ חיבור Google Ads
  ├─ OAuth flow
  ├─ Connected accounts list
  └─ Account management

CampaignsPage.jsx (יום 4)
  ├─ תצוגת campaigns
  ├─ Stats overview
  ├─ Campaign metrics
  └─ Links: /app/campaigns/:accountId
```

---

### **📂 frontend/src/components/**

```
LiveClicksFeed.jsx (יום 5)
  ├─ פיד clicks בזמן אמת
  ├─ עדכון כל 10 שניות
  ├─ Features:
  │   ├─ Country flags 🇮🇱🇺🇸🇬🇧
  │   ├─ Device icons 📱💻
  │   ├─ Slide-in animations
  │   ├─ Time ago ("לפני 5 שניות")
  │   └─ Cost in ILS (₪2.50)
  └─ Props: { accountId }

DetectionSettings.jsx (יום 6)
  ├─ בחירת רמת זיהוי
  ├─ 3 cards:
  │   ├─ 🧘 רגוע על מלא
  │   ├─ 🤨 חשדן בקטנה ⭐
  │   └─ 😤 בלי חרטות
  ├─ Use cases per level
  ├─ Save to database
  └─ Props: { accountId }

FraudAlertsPanel.jsx (יום 6)
  ├─ פאנל התראות הונאה
  ├─ 4 סטטיסטיקות:
  │   ├─ שיעור הונאה
  │   ├─ זיהויים
  │   ├─ עלות הונאה
  │   └─ אחוז מתקציב
  ├─ רשימת התראות
  ├─ סינון (high/medium/low)
  └─ Props: { accountId }
```

---

### **📂 frontend/src/ (root files)**

```
main.jsx
  ├─ React Router setup
  ├─ Routes:
  │   ├─ / → LoginPage
  │   ├─ /app/dashboard → DashboardHebrew
  │   ├─ /app/connect-ads → ConnectAdsPage
  │   └─ /app/campaigns/:accountId → CampaignsPage
  └─ Protected routes

index.css
  ├─ Global styles
  ├─ CSS variables:
  │   ├─ --color-bg-primary
  │   ├─ --color-cyan
  │   ├─ --color-purple
  │   └─ --color-magenta
  ├─ Utility classes:
  │   ├─ .glass
  │   ├─ .glass-strong
  │   └─ .gradient-text
  └─ Animations

package.json
  ├─ Dependencies:
  │   ├─ react
  │   ├─ react-dom
  │   ├─ react-router-dom
  │   └─ (TailwindCSS via CDN)
  └─ Scripts:
      ├─ npm run dev (vite)
      └─ npm run build
```

---

## 🗄️ **DATABASE FILES**

### **📂 database/**

```
schema.sql (יום 2)
  ├─ 24 טבלאות:
  │
  ├─ Core:
  │   ├─ users
  │   ├─ ad_accounts (+detection_preset יום 6)
  │   ├─ campaigns
  │   ├─ ad_groups
  │   ├─ ads
  │   └─ keywords
  │
  ├─ Events & Detection:
  │   ├─ raw_events
  │   ├─ fraud_detections
  │   ├─ fraud_patterns
  │   ├─ suspicious_ips
  │   └─ blocked_ips
  │
  ├─ Analysis:
  │   ├─ click_analytics
  │   ├─ conversion_events
  │   ├─ device_fingerprints
  │   └─ geo_locations
  │
  ├─ ML & Predictions:
  │   ├─ ml_models
  │   ├─ ml_predictions
  │   ├─ pattern_clusters
  │   └─ anomaly_scores
  │
  └─ System:
      ├─ alerts
      ├─ alert_subscriptions
      ├─ whatsapp_messages
      ├─ user_settings
      └─ audit_logs
```

---

## 📚 **DOCUMENTATION FILES**

### **📂 outputs/day1-2-setup/**
```
PROJECT_STRUCTURE.md - מבנה הפרויקט המלא
TECH_STACK.md - טכנולוגיות ותלויות
60_DAY_ROADMAP.md - תוכנית 60 ימים
```

### **📂 outputs/day3-auth/**
```
[auth related files]
LoginPage.jsx
DashboardHebrew.jsx
auth.js routes
```

### **📂 outputs/day4-google-ads/**
```
GoogleAdsService.js
googleads.js routes
ConnectAdsPage.jsx
CampaignsPage.jsx
DAY4_STEP3_FRONTEND_GUIDE.md
FIX_OAUTH_CLIENT.md
```

### **📂 outputs/day5-clicks/**
```
ClicksService.js
clicks.js routes
LiveClicksFeed.jsx
server-day5.js
DAY5_COMPLETE_GUIDE.md
```

### **📂 outputs/day6-detection/**
```
DetectionEngine.js
detection.js routes
DetectionSettings.jsx
FraudAlertsPanel.jsx
server-day6.js
DAY6_COMPLETE_GUIDE.md
DAY6_STEP_BY_STEP.md ⭐
```

---

## 🎯 **קבצים לפי יום:**

### **יום 1:**
```
- PROJECT_STRUCTURE.md
- TECH_STACK.md
- 60_DAY_ROADMAP.md
- package.json (backend)
- package.json (frontend)
- .gitignore
```

### **יום 2:**
```
- schema.sql (24 tables)
- supabase.js
```

### **יום 3:**
```
- auth.js (routes)
- LoginPage.jsx
- DashboardHebrew.jsx
- main.jsx
- index.css
- server.js (initial)
```

### **יום 4:**
```
- GoogleAdsService.js
- googleads.js (routes)
- ConnectAdsPage.jsx
- CampaignsPage.jsx
- main.jsx (updated routes)
- server.js (updated)
```

### **יום 5:**
```
- ClicksService.js
- clicks.js (routes)
- LiveClicksFeed.jsx
- server.js (updated)
```

### **יום 6:**
```
- DetectionEngine.js
- detection.js (routes)
- DetectionSettings.jsx
- FraudAlertsPanel.jsx
- DashboardHebrew.jsx (updated)
- server.js (updated)
- SQL: ALTER TABLE ad_accounts ADD detection_preset
```

---

## 📊 **סיכום מספרי:**

```
📁 Total Files Created: ~35 קבצים
📂 Backend: 12 קבצים
📂 Frontend: 10 קבצים
📂 Database: 1 קובץ (24 tables)
📂 Documentation: 12+ קבצים

📝 Lines of Code:
   Backend: ~3,500 שורות
   Frontend: ~2,800 שורות
   Total: ~6,300 שורות

⏱️ Time Invested: 6 ימי עבודה
✅ Completion: 10% (6/60 days)
```

---

## 🔍 **איך למצוא קובץ:**

**לפי תכונה:**
```
"אני צריך את הקובץ שמטפל ב-clicks"
→ backend/services/ClicksService.js
→ backend/routes/clicks.js
→ frontend/src/components/LiveClicksFeed.jsx

"איפה הגדרת הדטקשן?"
→ backend/services/DetectionEngine.js
→ frontend/src/components/DetectionSettings.jsx

"איפה הטבלאות?"
→ database/schema.sql
```

**לפי API:**
```
POST /api/clicks/:accountId/sync
→ backend/routes/clicks.js
→ Uses: ClicksService.syncClicks()

GET /api/detection/presets
→ backend/routes/detection.js
→ Uses: DetectionEngine.getAllPresets()
```

---

## ⚠️ **קבצים שצריך לעדכן בעתיד:**

```
🔄 server.js - נעדכן כל יום עם routes חדשים
🔄 DashboardHebrew.jsx - נוסיף components חדשים
🔄 main.jsx - נוסיף routes חדשים
🔄 schema.sql - אולי נוסיף columns/tables
🔄 .env.local - נוסיף API keys חדשים
```

---

## 💡 **טיפים:**

1. **כל קובץ מתחיל עם הערה** - מסביר מה הוא עושה
2. **שמות ברורים** - GoogleAdsService, ClicksService, etc.
3. **ארגון לוגי** - services/ routes/ components/
4. **תיעוד מלא** - כל function מתועדת
5. **Hebrew בUI** - כל הטקסטים בעברית

---

**זוכר: יש לך גיבוי של הכל! 💾**