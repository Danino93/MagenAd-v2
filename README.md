# 🛡️ MagenAd V2

**מערכת הגנה חכמה על תקציבי Google Ads מפני קליקים בעייתיים**

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![Version](https://img.shields.io/badge/version-2.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

---

## 📖 **מה זה MagenAd?**

MagenAd היא מערכת ניטור והגנה מתקדמת שמזהה קליקים בעייתיים בקמפיינים של Google Ads בזמן אמת. המערכת בנויה כשכבת ניטור והחלטה **נפרדת לחלוטין** ממערכת הפרסום - היא לא נוגעת בקמפיינים, לא "משפרת", ולא מתערבת. היא רק **מנתחת, מסווגת, ומבצעת פעולות בטוחות**.

### 🎯 **הבעיה שפתרנו:**
עסקים קטנים-בינוניים עם תקציבי Google Ads של 5,000-50,000 ₪/חודש סובלים מ:
- **קליקים חוזרים** מאותו מקור שמבזבזים תקציב
- **פעילות חשודה** בשעות לא רגילות (לילות, סופי שבוע)
- **קפיצות פתאומיות** בעלויות ללא סיבה ברורה
- **הונאות וקליקים לא איכותיים** שמורידים את ה-ROI
- **חוסר שקיפות** - לא יודעים איפה הכסף הולך

### ✨ **הפתרון המלא:**
- **12 כללי זיהוי חכמים** - מזהים התנהגות חריגה על בסיס Baseline דינמי
- **Quiet Index™** - ציון איכות קליקים (0-100) שמציג את הבריאות הכללית של הקמפיין
- **3 רמות רגישות** - 🧘 רגוע | 🤨 חשדן | 😤 בלי חרטות - מותאם לכל עסק
- **ניטור בזמן אמת** - התראות מיידיות על חריגות
- **דוחות חודשיים** - סטטיסטיקות מפורטות וניתוחים
- **WhatsApp Integration** - התראות ישירות לוואטסאפ
- **Learning Mode** - 7 ימים של למידה לבניית Baseline מותאם אישית

---

## 🚀 **תכונות עיקריות**

### 🔍 **מנוע זיהוי מתקדם (12 כללים)**
המערכת מזהה חריגות מהתנהגות סבירה על בסיס Baseline דינמי:

**Frequency Rules (חזרתיות):**
1. ✅ Same IP Multiple Clicks - אותו מקור לוחץ יותר מדי
2. ✅ Rapid Fire Clicks - קליקים מהירים מדי
3. 🚧 Same Device Pattern - דפוסי מכשיר חוזרים
4. 🚧 Keyword Repetition - חזרה על מילות מפתח

**Burst Rules (קפיצות):**
5. ✅ Cost Spike - קפיצה פתאומית בעלויות
6. ✅ Weekend Surge - פעילות חריגה בסופי שבוע
7. 🚧 Traffic Burst - נפח קליקים קופץ פתאום
8. 🚧 Campaign Anomaly - חריגה בקמפיין ספציפי

**Temporal Rules (זמן):**
9. ✅ Night Activity - פעילות בשעות לא רגילות
10. ✅ Business Hours Deviation - חריגה משעות עבודה
11. 🚧 Holiday Pattern - דפוסים בחגים
12. 🚧 Time Zone Mismatch - חוסר התאמה של אזור זמן

**תכונות נוספות:**
- **Quiet Index™** - ציון איכות קליקים (0-100) - 100 = כל הקליקים נקיים
- **3 רמות רגישות**: 🧘 רגוע (8+ clicks/hour) | 🤨 חשדן (5+ clicks/hour) ⭐ | 😤 בלי חרטות (3+ clicks/hour)
- **False Positive Prevention** - מניעת התראות שווא עם Cooldown
- **Learning Mode** - 7 ימים של למידה לבניית Baseline מותאם אישית

### 📊 **Dashboard בזמן אמת**
- **Live Clicks Feed** - רשימת קליקים מתעדכנת כל 10 שניות עם אנימציות
- **Fraud Alerts Panel** - התראות הונאה עם סטטיסטיקות מפורטות
- **Detection Settings** - הגדרת רמת הרגישות עם 3 פרופילים
- **Quiet Index Widget** - תצוגה ויזואלית של איכות הקליקים
- **עיצוב מודרני** - Dark theme עם RTL Hebrew מלא

### 📈 **דוחות וניתוחים**
- **דוחות חודשיים** - סטטיסטיקות מפורטות על הונאות שזוהו
- **Cost Impact Analysis** - ניתוח השפעה על התקציב
- **Trend Analysis** - זיהוי מגמות לאורך זמן
- **WhatsApp Reports** - דוחות ישירות לוואטסאפ

### 🔗 **אינטגרציות**
- **Google Ads API** - חיבור ישיר לחשבון הפרסום עם OAuth
- **Google OAuth** - התחברות מאובטחת למשתמשים
- **Supabase** - Database ו-Authentication מלא
- **WhatsApp Business API** - התראות ודוחות ישירות
- **Real-time Sync** - סנכרון אוטומטי כל 6 שעות

---

## 🛠️ **טכנולוגיות**

### **Frontend**
- ⚛️ React 18 + Vite
- 🎨 Tailwind CSS
- 🌐 React Router
- 📱 Responsive Design

### **Backend**
- 🟢 Node.js + Express
- 🔐 JWT Authentication
- 📡 RESTful API
- 🔄 Google Ads API Integration

### **Database**
- 🗄️ Supabase (PostgreSQL)
- 🔒 Row Level Security
- 📊 24 טבלאות מוכנות

---

## 📦 **התקנה**

### **דרישות מוקדמות**
- Node.js 18+ 
- npm או yarn
- חשבון Google Cloud (ל-OAuth)
- חשבון Supabase (ל-Database)
- Google Ads Developer Token

### **שלבי התקנה**

1. **Clone את הפרויקט**
```bash
git clone https://github.com/Danino93/MagenAd-v2.git
cd MagenAd-v2
```

2. **התקן dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **הגדר משתני סביבה**

צור `backend/.env.local`:
```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Google Ads
GOOGLE_ADS_CLIENT_ID=your_ads_client_id
GOOGLE_ADS_CLIENT_SECRET=your_ads_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_REDIRECT_URI=http://localhost:3001/api/googleads/callback

# JWT
JWT_SECRET=your_jwt_secret

# Server
PORT=3001
```

4. **הגדר את Database**
- הרץ את ה-SQL schema מ-`db/schema/database_ultimate_schema.sql` ב-Supabase
- הגדר Row Level Security policies

5. **הרץ את השרתים**
```bash
# Backend (טרמינל 1)
cd backend
npm run dev

# Frontend (טרמינל 2)
cd frontend
npm run dev
```

6. **פתח בדפדפן**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

---

## 📚 **תיעוד**

### **קבצי תיעוד עיקריים:**
- 📊 [`docs/Project-state.MD`](docs/Project-state.MD) - מצב הפרויקט הנוכחי
- 📁 [`docs/Files-inventory.MD`](docs/Files-inventory.MD) - רשימת כל הקבצים
- 🎨 [`docs/DESIGN_DECISIONS.md`](docs/DESIGN_DECISIONS.md) - החלטות עיצוב וטכניות
- ✅ [`docs/HANDOFF_CHECKLIST.md`](docs/HANDOFF_CHECKLIST.md) - מדריך setup והמשך עבודה
- 🛠️ [`docs/01_TECHNICAL_BLUEPRINT_COMPLETE.md`](docs/01_TECHNICAL_BLUEPRINT_COMPLETE.md) - ארכיטקטורה מלאה
- 🎯 [`docs/02_DETECTION_RULES_FINAL.md`](docs/02_DETECTION_RULES_FINAL.md) - כללי זיהוי מפורטים

---

## 🎯 **מצב הפרויקט**

### ✅ **הושלם (ימים 1-6):**
- [x] Backend Setup + Authentication (Google OAuth + JWT)
- [x] Frontend Setup + Dashboard (React + Tailwind + RTL)
- [x] Google Ads Integration (OAuth + API)
- [x] Data Ingestion (Clicks Service + Sync)
- [x] Detection Engine (8 כללים מתוך 12)
- [x] Live Clicks Feed (Real-time updates)
- [x] Fraud Alerts Panel (Stats + Alerts)
- [x] Detection Settings (3 רמות רגישות)
- [x] Database Schema (24 טבלאות מוכנות)

### 🚧 **בפיתוח (ימים 7-60):**
- [ ] Quiet Index™ Algorithm (יום 7)
- [ ] 4 כללי זיהוי נוספים (ימים 8-10)
- [ ] WhatsApp Integration (שבוע 5-6)
- [ ] Monthly Reports (שבוע 5-6)
- [ ] Advanced Analytics (שבוע 7-8)
- [ ] Learning Mode & Baseline (שבוע 3-4)
- [ ] Decision Engine (שבוע 4)
- [ ] UI/UX Polish (שבוע 7-8)

### 🎯 **החזון הסופי:**
מערכת SaaS מלאה שתכלול:
- **12 כללי זיהוי פעילים** - זיהוי מקיף של כל סוגי ההונאות
- **Quiet Index™ מלא** - ציון איכות מדויק ומעודכן
- **WhatsApp Integration** - התראות ודוחות ישירות
- **דוחות חודשיים מפורטים** - ניתוחים עמוקים
- **Learning Mode מתקדם** - Baseline מותאם אישית לכל עסק
- **Decision Engine** - המלצות אוטומטיות לפעולה
- **Multi-Account Support** - תמיכה בכמה חשבונות Google Ads
- **Priority Support** - תמיכה מקצועית ללקוחות Business

### 💼 **מודל עסקי:**
- **Starter** - ₪299/חודש (תקציב 3K-10K)
- **Pro** - ₪499/חודש (תקציב 10K-30K) ⭐
- **Business** - ₪999/חודש (תקציב 30K-100K)

---

## 🏗️ **ארכיטקטורה - 7 שכבות**

המערכת בנויה ב-7 שכבות עצמאיות:

```
┌─────────────────────────────────────────┐
│   7. Control Dashboard (React)        │
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
│   שמירת אמת היסטורית (24 טבלאות)        │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   4. Decision Engine                    │
│   מה עושים עם החריגה                    │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   3. Detection Engine                   │
│   זיהוי חריגות (12 כללים)              │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   2. Data Ingestion Layer               │
│   איסוף נתונים גולמיים (כל 6 שעות)      │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   1. Integration Layer                  │
│   Google Ads API (OAuth)                │
└─────────────────────────────────────────┘
```

**עיקרון מרכזי:** כל שכבה עצמאית - אף שכבה לא "יודעת" איך אחרת עובדת.

## 📁 **מבנה הפרויקט**

```
MagenAd-v2/
├── backend/              # Node.js + Express API
│   ├── routes/          # API routes (auth, clicks, detection, googleads)
│   ├── services/        # Business logic (DetectionEngine, ClicksService, etc.)
│   ├── config/          # Configuration (Supabase, etc.)
│   └── server.js        # Entry point
│
├── frontend/            # React + Vite
│   ├── src/
│   │   ├── components/  # React components (LiveClicksFeed, FraudAlertsPanel, etc.)
│   │   ├── pages/       # Page components (Dashboard, Login, etc.)
│   │   └── config/      # Frontend config
│   └── public/          # Static assets
│
├── db/                  # Database
│   ├── schema/          # SQL schemas (24 טבלאות)
│   └── migrations/      # Migration files
│
└── docs/                # Documentation
    ├── 01_TECHNICAL_BLUEPRINT_COMPLETE.md  # ארכיטקטורה מלאה
    ├── 02_DETECTION_RULES_FINAL.md         # 12 כללי זיהוי
    ├── 03_EXECUTION_PLAN_60_DAYS.md        # תוכנית 60 יום
    ├── 04_BUSINESS_COMPLIANCE.md           # מודל עסקי
    ├── Project-state.MD                    # מצב נוכחי
    ├── DESIGN_DECISIONS.md                 # החלטות עיצוב
    └── HANDOFF_CHECKLIST.md                # מדריך המשך עבודה
```

---

## 🔐 **אבטחה**

- ✅ JWT Authentication
- ✅ Row Level Security (Supabase)
- ✅ Environment Variables
- ✅ CORS Configuration
- ✅ Input Validation

---

## 🤝 **תרומה לפרויקט**

תרומות מתקבלות בברכה! 

1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/AmazingFeature`)
3. Commit את השינויים (`git commit -m 'Add some AmazingFeature'`)
4. Push ל-branch (`git push origin feature/AmazingFeature`)
5. פתח Pull Request

---

## 📝 **רישיון**

פרויקט זה מוגן תחת רישיון MIT - ראה את קובץ [LICENSE](LICENSE) לפרטים.

---

## 👤 **מחבר**

**Danino93**
- GitHub: [@Danino93](https://github.com/Danino93)
- Repository: [MagenAd-v2](https://github.com/Danino93/MagenAd-v2)

---

## 🙏 **תודות**

- Google Ads API
- Supabase
- React Community
- כל התורמים והמשתמשים

---

## 📞 **צור קשר**

לשאלות, הצעות או דיווח על באגים:
- פתח [Issue](https://github.com/Danino93/MagenAd-v2/issues)
- או צור [Pull Request](https://github.com/Danino93/MagenAd-v2/pulls)

---

<div align="center">

**⭐ אם הפרויקט עזר לך, תן לו Star! ⭐**

Made with ❤️ in Israel 🇮🇱

</div>

