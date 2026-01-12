# 🚀 מדריך Launch - MagenAd V2

**מדריך מסודר לפעם הראשונה - מה צריך לעשות לפני Launch**

---

## 📋 תוכן עניינים

1. [הרצת הפרויקט מקומית](#הרצת-הפרויקט-מקומית)
2. [בדיקות לפני Launch](#בדיקות-לפני-launch)
3. [הכנה ל-Production](#הכנה-ל-production)
4. [Launch Day](#launch-day)
5. [Post-Launch](#post-launch)

---

## 🖥️ הרצת הפרויקט מקומית

### שלב 1: התקנת Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### שלב 2: הגדרת Environment Variables

**Backend `.env.local`:**
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# JWT
JWT_SECRET=your_jwt_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret

# Server
PORT=3001
NODE_ENV=development
```

**Frontend `.env.local`:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### שלב 3: הרצת השרתים

**טרמינל 1 - Backend:**
```bash
cd backend
npm run dev
```

**טרמינל 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**אמור לראות:**
- Backend: `🚀 Server running on port 3001`
- Frontend: `Local: http://localhost:5173`

---

## ✅ בדיקות לפני Launch

### בדיקה 1: Backend Health Check

```bash
curl http://localhost:3001/api/health
```

**צריך לקבל:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

### בדיקה 2: Frontend נטען

1. פתח `http://localhost:5173`
2. בדוק שהדף נטען
3. בדוק שאין שגיאות בקונסול

### בדיקה 3: Jobs רצים

**בדוק שהשרת מריץ Jobs:**
```
🔄 Initializing cron jobs...
✅ All cron jobs initialized
```

**Jobs שצריכים לרוץ:**
- ✅ `ingest-clicks` - כל 6 שעות
- ✅ `calculate-baseline` - כל יום ב-02:00
- ✅ `run-detection` - כל שעה
- ✅ `generate-monthly-report` - 1 לחודש ב-00:05

### בדיקה 4: Detection Rules

**הרץ ידנית:**
```bash
cd backend
node jobs/run-detection.js
```

**צריך לראות:**
```
🔍 [DETECTION-JOB] Starting detection run...
📊 Found X active accounts
✅ Processed: X accounts
```

### בדיקה 5: Monthly Report

**הרץ ידנית:**
```bash
cd backend
node jobs/generate-monthly-report.js
```

**צריך לראות:**
```
📊 [MONTHLY-REPORT-JOB] Starting monthly report generation...
✅ Successfully generated monthly report
```

### בדיקה 6: Database

**בדוק שהטבלאות קיימות:**
- `users`
- `ad_accounts`
- `raw_events`
- `detections`
- `baseline_stats`
- `monthly_reports`
- `cooldown_tracker`
- `job_logs`

---

## 🚀 הכנה ל-Production

### שלב 1: Environment Variables ל-Production

**צור `.env.production` ב-Backend:**
```env
NODE_ENV=production
PORT=3001

# Supabase Production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_production_service_key

# JWT
JWT_SECRET=your_strong_jwt_secret_production

# Google OAuth Production
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

# Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your_production_token
GOOGLE_ADS_CLIENT_ID=your_production_client_id
GOOGLE_ADS_CLIENT_SECRET=your_production_client_secret

# WhatsApp (אופציונלי)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# Redis (אם יש)
REDIS_URL=redis://your-redis-url

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

**צור `.env.production` ב-Frontend:**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### שלב 2: Build ל-Production

**Backend:**
```bash
cd backend
npm install --production
```

**Frontend:**
```bash
cd frontend
npm run build
```

**הקובץ `dist/` צריך להיווצר**

### שלב 3: Database Migrations

**הרץ את כל ה-Migrations ב-Supabase:**
1. לך ל-Supabase Dashboard → SQL Editor
2. הרץ את כל הקבצים מ-`db/migrations/`
3. בדוק שהכל עבר בהצלחה

### שלב 4: SSL Certificate

**אם אתה משתמש ב-Nginx:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📅 Launch Day

### לפני Launch (יום לפני)

- [ ] כל הבדיקות עברו
- [ ] Build ל-Production עבר
- [ ] Environment Variables מוגדרים
- [ ] Database Migrations רצו
- [ ] SSL Certificate מותקן
- [ ] Backup strategy מוכן

### Launch Day - בוקר

**08:00 - בדיקות אחרונות:**
- [ ] Health check עובד
- [ ] Frontend נטען
- [ ] Backend עונה
- [ ] Jobs רצים

**09:00 - Deploy:**
- [ ] Deploy Backend
- [ ] Deploy Frontend
- [ ] בדוק שהכל עובד

**10:00 - בדיקות Production:**
- [ ] בדוק Login
- [ ] בדוק Google Ads Connection
- [ ] בדוק Dashboard
- [ ] בדוק Detection

### Launch Day - צהריים

**12:00 - Announcement:**
- [ ] שלח הודעה ללקוחות
- [ ] עדכן Social Media
- [ ] שלח Email (אם יש)

**14:00 - Monitoring:**
- [ ] בדוק Logs
- [ ] בדוק Errors
- [ ] בדוק Performance

---

## 📊 Post-Launch

### יום 1 אחרי Launch

- [ ] בדוק Logs
- [ ] בדוק Errors
- [ ] בדוק User Activity
- [ ] תקן Bugs (אם יש)

### שבוע 1 אחרי Launch

- [ ] אסוף Feedback
- [ ] תקן Bugs
- [ ] שיפור Performance
- [ ] הוסף Features לפי צורך

### חודש 1 אחרי Launch

- [ ] סקור Metrics
- [ ] תכנן שיפורים
- [ ] הוסף Features חדשים

---

## ⚠️ Troubleshooting

### בעיה: Frontend לא נטען

**פתרונות:**
1. בדוק ש-`npm install` רץ
2. בדוק ש-`.env.local` קיים
3. בדוק ש-Port 5173 פנוי
4. בדוק Console ל-Errors

### בעיה: Backend לא עונה

**פתרונות:**
1. בדוק ש-`npm install` רץ
2. בדוק ש-`.env.local` קיים
3. בדוק ש-Port 3001 פנוי
4. בדוק Logs

### בעיה: Jobs לא רצים

**פתרונות:**
1. בדוק ש-`node-cron` מותקן
2. בדוק ש-`server.js` טוען את ה-Jobs
3. בדוק Logs

### בעיה: Database Errors

**פתרונות:**
1. בדוק ש-Supabase מחובר
2. בדוק ש-Service Key נכון
3. בדוק ש-Tables קיימות

---

## 📝 Checklist סופי

### לפני Launch:

- [ ] כל הבדיקות עברו
- [ ] Build ל-Production עבר
- [ ] Environment Variables מוגדרים
- [ ] Database Migrations רצו
- [ ] SSL Certificate מותקן
- [ ] Backup strategy מוכן
- [ ] Monitoring מוגדר
- [ ] Error Tracking מוגדר

### Launch Day:

- [ ] Deploy Backend
- [ ] Deploy Frontend
- [ ] בדיקות Production
- [ ] Announcement
- [ ] Monitoring

### אחרי Launch:

- [ ] בדוק Logs
- [ ] תקן Bugs
- [ ] אסוף Feedback
- [ ] תכנן שיפורים

---

**תאריך יצירה:** 2026-01-11  
**עודכן על ידי:** AI Assistant
