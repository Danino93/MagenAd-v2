# 📋 TODO - משימות ידניות (שאתה צריך לעשות)

**רשימת כל המשימות שדורשות פעולה שלך - אינטגרציות, הגדרות, ואישורים**

---

## 🔴 קריטי - לפני Launch

### 1. Google Ads API Setup

#### א. Google Cloud Console Setup
- [ ] כנס ל-https://console.cloud.google.com
- [ ] בחר/צור פרויקט
- [ ] Enable את Google Ads API
- [ ] צור OAuth 2.0 Client ID (או השתמש בקיים)
- [ ] הוסף Authorized Redirect URIs:
  - `http://localhost:3001/api/auth/google/callback` (Development)
  - `https://yourdomain.com/api/auth/google/callback` (Production)
- [ ] העתק `Client ID` ו-`Client Secret`
- [ ] הוסף ל-`.env.local` ב-Backend:
  ```env
  GOOGLE_CLIENT_ID=your_client_id
  GOOGLE_CLIENT_SECRET=your_client_secret
  GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
  ```

#### ב. Google Ads Developer Token
- [ ] כנס ל-https://ads.google.com/aw/apicenter
- [ ] בחר את החשבון שלך
- [ ] הגש בקשה ל-Developer Token
- [ ] **ממתין לאישור (1-2 ימים) ⏳**
- [ ] אחרי אישור - העתק את ה-Token
- [ ] הוסף ל-`.env.local`:
  ```env
  GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
  ```

#### ג. Google Ads OAuth Client (נפרד)
- [ ] צור OAuth Client נפרד ל-Google Ads (או השתמש באותו)
- [ ] הוסף Authorized Redirect URIs:
  - `http://localhost:3001/api/googleads/callback` (Development)
  - `https://yourdomain.com/api/googleads/callback` (Production)
- [ ] העתק `Client ID` ו-`Client Secret`
- [ ] הוסף ל-`.env.local`:
  ```env
  GOOGLE_ADS_CLIENT_ID=your_ads_client_id
  GOOGLE_ADS_CLIENT_SECRET=your_ads_client_secret
  ```

#### ד. בדיקת חיבור
- [ ] הרץ את השרת
- [ ] כנס ל-`/app/connect-ads`
- [ ] לחץ "חברו את Google Ads"
- [ ] השלם את ה-OAuth flow
- [ ] בדוק שהחשבון נשמר ב-`ad_accounts` table

---

### 2. Supabase Setup

#### א. Database Migrations
- [ ] כנס ל-Supabase Dashboard → SQL Editor
- [ ] הרץ את כל הקבצים מ-`db/migrations/` בסדר:
  1. `2026-01-11__realtime-setup-FIXED.sql`
  2. `2026-01-11__database-optimization.sql`
  3. כל שאר ה-migrations (אם יש)
- [ ] בדוק שהטבלאות נוצרו:
  - `users`
  - `ad_accounts`
  - `raw_events`
  - `detections`
  - `baseline_stats`
  - `monthly_reports`
  - `cooldown_tracker`
  - `job_logs`
  - `activity_feed`
  - `notifications`

#### ב. Realtime Setup
- [ ] בדוק ש-Realtime מופעל:
  ```sql
  SELECT schemaname, tablename 
  FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime';
  ```
- [ ] צריך לראות: `anomalies`, `baseline_stats`, `activity_feed`, `detections`, `campaigns`

#### ג. RLS Policies
- [ ] בדוק ש-RLS מופעל על כל הטבלאות
- [ ] בדוק שהפוליסיות עובדות (אם צריך)

---

### 3. WhatsApp Business API (אופציונלי - אבל מומלץ)

#### א. Facebook Business Account
- [ ] צור Facebook Business Account
- [ ] צור WhatsApp Business Account
- [ ] קבל Phone Number ID
- [ ] קבל Access Token
- [ ] הוסף ל-`.env.local`:
  ```env
  WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
  WHATSAPP_ACCESS_TOKEN=your_access_token
  ```

#### ב. בדיקת שליחה
- [ ] שלח הודעת טסט
- [ ] בדוק שההודעה הגיעה

---

### 4. Email Service (אופציונלי)

#### א. SMTP Setup
- [ ] בחר ספק Email (SendGrid, Mailgun, או Gmail SMTP)
- [ ] קבל API Key / Credentials
- [ ] הוסף ל-`.env.local`:
  ```env
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_USER=apikey
  SMTP_PASS=your_api_key
  EMAIL_FROM=noreply@magenad.com
  ```

#### ב. בדיקת שליחה
- [ ] שלח Email טסט
- [ ] בדוק שהמייל הגיע

---

## 🟡 חשוב - לפני Production

### 5. Production Environment Variables

#### א. Backend `.env.production`
- [ ] צור `.env.production` ב-Backend
- [ ] העתק את כל המשתנים מ-`.env.local`
- [ ] עדכן ל-Production URLs:
  ```env
  NODE_ENV=production
  FRONTEND_URL=https://yourdomain.com
  GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
  SUPABASE_URL=https://your-project.supabase.co
  ```

#### ב. Frontend `.env.production`
- [ ] צור `.env.production` ב-Frontend
- [ ] עדכן URLs:
  ```env
  VITE_API_URL=https://api.yourdomain.com/api
  VITE_SUPABASE_URL=https://your-project.supabase.co
  ```

---

### 6. Domain & SSL

#### א. Domain Setup
- [ ] קנה Domain (אם אין)
- [ ] הגדר DNS:
  - A Record → Server IP
  - CNAME → www → yourdomain.com

#### ב. SSL Certificate
- [ ] התקן SSL (Let's Encrypt או אחר):
  ```bash
  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
  ```
- [ ] בדוק ש-HTTPS עובד

---

### 7. Server Setup (אם Deploy לשרת)

#### א. Server Configuration
- [ ] התקן Node.js 18+
- [ ] התקן Nginx (אם צריך)
- [ ] הגדר Firewall
- [ ] הגדר PM2 או Docker

#### ב. Monitoring
- [ ] התקן Monitoring (אם צריך)
- [ ] הגדר Alerts
- [ ] הגדר Logs aggregation

---

## 🟢 אופציונלי - שיפורים

### 8. Redis Setup (לשיפור Performance)

#### א. Redis Installation
- [ ] התקן Redis (מקומי או Cloud)
- [ ] קבל Connection String
- [ ] הוסף ל-`.env.local`:
  ```env
  REDIS_URL=redis://localhost:6379
  ```

#### ב. בדיקה
- [ ] בדוק ש-Redis מחובר
- [ ] בדוק ש-Caching עובד

---

### 9. Google Analytics / Tracking

#### א. Google Analytics
- [ ] צור Google Analytics Account
- [ ] קבל Tracking ID
- [ ] הוסף ל-Frontend (אם רוצה)

---

### 10. Payment Processing (אם יש)

#### א. Stripe / PayPal Setup
- [ ] צור Account
- [ ] קבל API Keys
- [ ] הוסף ל-`.env.local`
- [ ] בדוק Integration

---

## 📝 Checklist סופי

### לפני Development:
- [ ] Google Ads OAuth מוגדר
- [ ] Google Ads Developer Token מאושר
- [ ] Supabase Migrations רצו
- [ ] `.env.local` מלא בכל המשתנים

### לפני Testing:
- [ ] חיבור Google Ads עובד
- [ ] Jobs רצים
- [ ] Detection Rules עובדים
- [ ] Realtime עובד

### לפני Production:
- [ ] Production Environment Variables מוגדרים
- [ ] Domain & SSL מוכנים
- [ ] Server מוכן
- [ ] Monitoring מוגדר
- [ ] Backup strategy מוכן

---

## 🆘 עזרה

### אם יש בעיות:

**Google Ads OAuth לא עובד:**
- בדוק ש-Redirect URI תואם בדיוק
- בדוק ש-Client ID/Secret נכונים
- בדוק ש-Google Ads API מופעל

**Developer Token לא מאושר:**
- זה לוקח 1-2 ימים
- בינתיים אפשר להשתמש ב-test mode

**Supabase Errors:**
- בדוק ש-Service Key נכון
- בדוק ש-Tables קיימות
- בדוק ש-RLS Policies מוגדרות

---

**תאריך יצירה:** 2026-01-11  
**עודכן על ידי:** AI Assistant
