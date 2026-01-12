# 🚀 MagenAd V2 - Additional Improvements

**משימות נוספות לשיפור המערכת (לא קריטיות ל-Launch)**

---

## 📋 סיכום

| # | משימה | זמן משוער | עדיפות | תועלת |
|---|-------|-----------|--------|-------|
| 1 | BaselineStatsService | 1 יום | 🟡 בינוני | שיפור דיוק |
| 2 | Profiles Service | 1 יום | 🟡 בינוני | Customization |
| 3 | Advanced Analytics | 2 ימים | 🟢 נמוך | Value Add |
| 4 | Email Notifications | 1 יום | 🟢 נמוך | UX |
| 5 | API Documentation Site | 1 יום | 🟢 נמוך | Developer Experience |

**סה"כ:** 6 ימי עבודה (אופציונלי)

---

## 📅 יום 1: BaselineStatsService

**מטרה:** ליצור שירות נפרד לחישוב Baseline Statistics

**למה זה חשוב:**
- קוד יותר נקי ומודולרי
- קל יותר לבדוק ולתחזק
- ניתן לשימוש חוזר

**משימות:**

1. **צור `backend/services/BaselineStatsService.js`**

   **Cursor Prompt:**
   ```
   Create backend/services/BaselineStatsService.js:
   
   Service for calculating baseline statistics from raw_events.
   
   Methods:
   - async calculateBaseline(accountId, periodDays = 14) - main method
   - async calculateClicksPerDay(accountId, startDate) - daily click counts
   - async calculateClicksPerHour(accountId, startDate) - hourly distribution
   - async calculateDeviceDistribution(accountId, startDate) - device breakdown
   - async calculateNetworkDistribution(accountId, startDate) - network breakdown
   - async calculateGeographicDistribution(accountId, startDate) - country breakdown
   - async saveBaselineStat(accountId, metricType, periodDays, stats) - saves to DB
   
   Uses SQL functions for performance:
   - get_daily_click_counts(account_id, start_date)
   - get_hourly_click_counts(account_id, start_date)
   
   Include JSDoc comments in Hebrew.
   ```

2. **צור SQL Functions ב-Supabase**

   **SQL Script:**
   ```sql
   -- Function: get_daily_click_counts
   CREATE OR REPLACE FUNCTION get_daily_click_counts(
     account_id UUID,
     start_date TIMESTAMPTZ
   )
   RETURNS TABLE(date DATE, count BIGINT) AS $$
   BEGIN
     RETURN QUERY
     SELECT 
       click_timestamp::DATE as date,
       COUNT(*) as count
     FROM raw_events
     WHERE ad_account_id = account_id
       AND click_timestamp >= start_date
     GROUP BY click_timestamp::DATE
     ORDER BY date;
   END;
   $$ LANGUAGE plpgsql;
   
   -- Function: get_hourly_click_counts
   CREATE OR REPLACE FUNCTION get_hourly_click_counts(
     account_id UUID,
     start_date TIMESTAMPTZ
   )
   RETURNS TABLE(hour INTEGER, count BIGINT) AS $$
   BEGIN
     RETURN QUERY
     SELECT 
       EXTRACT(HOUR FROM click_timestamp)::INTEGER as hour,
       COUNT(*) as count
     FROM raw_events
     WHERE ad_account_id = account_id
       AND click_timestamp >= start_date
     GROUP BY EXTRACT(HOUR FROM click_timestamp)
     ORDER BY hour;
   END;
   $$ LANGUAGE plpgsql;
   ```

3. **עדכן `calculate-baseline.js`**
   - החלף את הלוגיקה המקומית בקריאה ל-`BaselineStatsService`

**Definition of Done:**
- ✅ BaselineStatsService קיים
- ✅ SQL Functions קיימות
- ✅ calculate-baseline.js מעודכן
- ✅ הכל עובד

---

## 📅 יום 2: Profiles Service

**מטרה:** ליצור שירות לניהול Profiles (detection presets)

**למה זה חשוב:**
- ניהול מרכזי של הגדרות זיהוי
- קל יותר לשנות presets
- תמיכה ב-custom profiles

**משימות:**

1. **צור `backend/services/ProfilesService.js`**

   **Cursor Prompt:**
   ```
   Create backend/services/ProfilesService.js:
   
   Service for managing detection profiles (presets).
   
   Methods:
   - async getProfile(accountId) - gets profile for account
   - async getDefaultProfile() - returns default profile config
   - async loadAccountProfile(accountId) - loads or creates profile
   - async updateProfile(accountId, updates) - updates profile
   - async setPreset(accountId, preset) - sets Easy/Normal/Aggressive
   - async updateThresholds(accountId, ruleId, thresholds) - custom thresholds
   - async updateBusinessHours(accountId, hours) - updates business hours
   
   Profile structure:
   - preset: 'easy' | 'normal' | 'aggressive'
   - thresholds: { ruleId: { threshold: number, ... } }
   - business_hours: { enabled: boolean, timezone: string, days: {...} }
   - cooldown_hours: number
   
   Uses profiles table.
   Include JSDoc comments in Hebrew.
   ```

2. **עדכן Detection Rules**
   - כל חוק צריך לקרוא profile מ-`ProfilesService`
   - להשתמש ב-thresholds מ-profile

3. **עדכן Frontend**
   - הוסף UI לשינוי preset
   - הוסף UI לעדכון business hours

**Definition of Done:**
- ✅ ProfilesService קיים
- ✅ Detection Rules משתמשים ב-ProfilesService
- ✅ Frontend מעודכן

---

## 📅 יום 3-4: Advanced Analytics

**מטרה:** להוסיף אנליטיקס מתקדמים

**למה זה חשוב:**
- Value Add ללקוחות
- הבנה טובה יותר של הנתונים
- Competitive Advantage

**משימות:**

1. **Trend Analysis**
   - זיהוי מגמות (עלייה/ירידה)
   - חיזוי (forecasting)
   - השוואות תקופתיות

2. **Campaign Performance**
   - ביצועי קמפיינים
   - ROI analysis
   - Cost efficiency

3. **Geographic Insights**
   - Heatmap של קליקים
   - Country performance
   - Regional patterns

4. **Device & Network Analysis**
   - Device breakdown
   - Network performance
   - Conversion by device

**Definition of Done:**
- ✅ Analytics מתקדמים קיימים
- ✅ UI להצגת Analytics
- ✅ Export options

---

## 📅 יום 5: Email Notifications

**מטרה:** להוסיף התראות במייל

**למה זה חשוב:**
- לא כל אחד משתמש ב-WhatsApp
- Email הוא יותר פורמלי
- Backup ל-WhatsApp

**משימות:**

1. **צור `backend/services/EmailService.js`**

   **Cursor Prompt:**
   ```
   Create backend/services/EmailService.js:
   
   Service for sending email notifications.
   
   Uses: nodemailer or SendGrid
   
   Methods:
   - async sendEmail(to, subject, html) - sends email
   - async sendMonthlyReport(user, report) - sends monthly report
   - async sendAlert(user, alert) - sends fraud alert
   - formatMonthlyReportEmail(report) - formats HTML email
   - formatAlertEmail(alert) - formats alert email
   
   Include JSDoc comments in Hebrew.
   ```

2. **עדכן Monthly Report Job**
   - שלח גם במייל (בנוסף ל-WhatsApp)

3. **עדכן Alert Service**
   - שלח התראות במייל

**Definition of Done:**
- ✅ EmailService קיים
- ✅ הודעות נשלחות
- ✅ HTML templates יפים

---

## 📅 יום 6: API Documentation Site

**מטרה:** ליצור אתר תיעוד API

**למה זה חשוב:**
- Developer Experience
- Integration עם מערכות אחרות
- Professional appearance

**משימות:**

1. **צור `docs/api/` directory**
   - OpenAPI/Swagger spec
   - Examples
   - Authentication guide

2. **צור `frontend/src/pages/APIDocs.jsx`**
   - Interactive API documentation
   - Try it out functionality
   - Code examples

3. **או השתמש ב-Swagger UI**
   - Auto-generate from OpenAPI spec

**Definition of Done:**
- ✅ API Documentation קיים
- ✅ Interactive examples
- ✅ Easy to use

---

## 🎯 סדר עדיפויות

### עדיפות גבוהה (לאחר Launch):
1. **BaselineStatsService** - שיפור דיוק
2. **Profiles Service** - Customization

### עדיפות בינונית:
3. **Email Notifications** - UX
4. **Advanced Analytics** - Value Add

### עדיפות נמוכה:
5. **API Documentation Site** - Nice to have

---

## 📝 הערות

- כל המשימות האלה **לא קריטיות ל-Launch**
- ניתן לעשות אותן אחרי שיש לקוחות ראשונים
- עדיף להתמקד ב-Final Phase Work Plan קודם

---

**תאריך יצירה:** 2026-01-11  
**עודכן על ידי:** AI Assistant
