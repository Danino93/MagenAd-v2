# 🎯 MagenAd V2 - Final Phase Work Plan

**מטרה:** לסגור את כל החסרים הקריטיים לפני Launch  
**משך זמן משוער:** 6-8 ימי עבודה  
**סטטוס:** Ready to Start

---

## 📋 סיכום החסרים הקריטיים

| # | משימה | זמן משוער | עדיפות |
|---|-------|-----------|--------|
| 1 | Detection Rules Refactor | 3-4 ימים | 🔴 קריטי |
| 2 | Monthly Report Job | 1 יום | 🔴 קריטי |
| 3 | WhatsApp Integration | 1 יום | 🔴 קריטי |
| 4 | Cooldown Service | 1 יום | 🔴 קריטי |

**סה"כ:** 6-8 ימי עבודה

---

## 📅 יום 1-2: Detection Rules - Setup & Base Class

### יום 1: יצירת מבנה החוקים

**מטרה:** ליצור את המבנה הבסיסי של מערכת החוקים

**משימות:**

1. **צור תיקייה `backend/rules/`**
   ```bash
   mkdir backend/rules
   ```

2. **צור Base Class `DetectionRule.js`**

   **Cursor Prompt:**
   ```
   Create backend/rules/DetectionRule.js:
   
   Base class for all detection rules with:
   - constructor(ruleId, ruleName, severity)
   - async detect(account, timeWindow) - abstract method
   - async checkCooldown(accountId, sourceKey) - uses CooldownService
   - async setCooldown(accountId, sourceKey, hours) - uses CooldownService
   - calculateSeverity(detectionData) - returns 'high'|'medium'|'low'
   - formatDetectionMessage(detectionData) - returns string
   - async saveDetection(accountId, detection) - saves to detections table
   
   Include JSDoc comments in Hebrew.
   ```

3. **צור `backend/services/CooldownService.js`**

   **Cursor Prompt:**
   ```
   Create backend/services/CooldownService.js:
   
   Service for managing cooldown periods to prevent duplicate detections.
   
   Methods:
   - async checkCooldown(accountId, ruleCode, sourceKey) - returns boolean
   - async setCooldown(accountId, ruleCode, sourceKey, hours = 12) - sets cooldown
   - async clearCooldown(accountId, ruleCode, sourceKey) - clears cooldown
   - async getActiveCooldowns(accountId) - returns all active cooldowns
   - async cleanupExpiredCooldowns() - removes expired entries
   
   Uses cooldown_tracker table.
   Include JSDoc comments in Hebrew.
   ```

**Definition of Done:**
- ✅ תיקייה `backend/rules/` קיימת
- ✅ `DetectionRule.js` קיים ועובד
- ✅ `CooldownService.js` קיים ועובד
- ✅ אין שגיאות קומפילציה

---

### יום 2: חוקים A1-A3 (Frequency Rules)

**מטרה:** ליצור את 3 החוקים הראשונים (Frequency)

**משימות:**

1. **צור `backend/rules/A1-RapidRepeat.js`**

   **Cursor Prompt:**
   ```
   Create backend/rules/A1-RapidRepeat.js:
   
   Extends DetectionRule.
   
   Rule: Rapid Repeat Clicks
   - Detects: 3+ clicks from same source within 2 minutes
   - Severity: High
   - Thresholds:
     * Easy: 4 clicks / 2 minutes
     * Normal: 3 clicks / 2 minutes
     * Aggressive: 2 clicks / 2 minutes
   
   Implementation:
   - Uses generateSourceKey() from utils/sourceKey.js
   - Groups clicks by source key
   - Checks time window (2 minutes)
   - Uses profile preset (Easy/Normal/Aggressive)
   - Checks cooldown before reporting
   - Saves detection to detections table
   
   Include JSDoc comments in Hebrew.
   ```

2. **צור `backend/rules/A2-ShortWindow.js`**

   **Cursor Prompt:**
   ```
   Create backend/rules/A2-ShortWindow.js:
   
   Extends DetectionRule.
   
   Rule: Short Window Repeat
   - Detects: 5+ clicks from same source within 10 minutes
   - Severity: Medium
   - Thresholds:
     * Easy: 6 clicks / 10 minutes
     * Normal: 5 clicks / 10 minutes
     * Aggressive: 4 clicks / 10 minutes
   
   Similar implementation to A1 but different time window.
   Include JSDoc comments in Hebrew.
   ```

3. **צור `backend/rules/A3-DailyRepeat.js`**

   **Cursor Prompt:**
   ```
   Create backend/rules/A3-DailyRepeat.js:
   
   Extends DetectionRule.
   
   Rule: Daily Repeat Source
   - Detects: 8+ clicks from same source within 24 hours
   - Severity: Medium
   - Thresholds:
     * Easy: 10 clicks / 24 hours
     * Normal: 8 clicks / 24 hours
     * Aggressive: 6 clicks / 24 hours
   
   Checks daily patterns.
   Include JSDoc comments in Hebrew.
   ```

**Definition of Done:**
- ✅ 3 חוקים קיימים
- ✅ כל חוק עובד עצמאית
- ✅ כל חוק משתמש ב-CooldownService
- ✅ כל חוק שומר detections ל-DB

---

## 📅 יום 3: חוקים B1-B3 (Burst Rules)

**מטרה:** ליצור את 3 החוקים של Burst Detection

**משימות:**

1. **צור `backend/rules/B1-AccountSpike.js`**

   **Cursor Prompt:**
   ```
   Create backend/rules/B1-AccountSpike.js:
   
   Extends DetectionRule.
   
   Rule: Account Spike
   - Detects: Account-level click spike (2x average)
   - Severity: Medium
   - Uses baseline_stats table for comparison
   - Compares current hour clicks vs. baseline avg_clicks_per_hour
   - Threshold: current >= baseline * 2
   
   Include JSDoc comments in Hebrew.
   ```

2. **צור `backend/rules/B2-CampaignSpike.js`**

   **Cursor Prompt:**
   ```
   Create backend/rules/B2-CampaignSpike.js:
   
   Extends DetectionRule.
   
   Rule: Campaign Spike
   - Detects: Campaign-level click spike (2.3x average)
   - Severity: Medium
   - Uses baseline_stats table filtered by campaign_id
   - Compares current hour clicks vs. campaign baseline
   - Threshold: current >= baseline * 2.3
   
   Include JSDoc comments in Hebrew.
   ```

3. **צור `backend/rules/B3-MicroBurst.js`**

   **Cursor Prompt:**
   ```
   Create backend/rules/B3-MicroBurst.js:
   
   Extends DetectionRule.
   
   Rule: Micro-Burst
   - Detects: 12+ clicks within 2 minutes (account-wide)
   - Severity: High
   - Checks total clicks in 2-minute window across all sources
   - Threshold: 12+ clicks
   - Very aggressive detection for bot attacks
   
   Include JSDoc comments in Hebrew.
   ```

**Definition of Done:**
- ✅ 3 חוקי Burst קיימים
- ✅ כל חוק משתמש ב-baseline_stats
- ✅ כל חוק עובד נכון

---

## 📅 יום 4: חוקים C1-C2, D1, E1-E2 (Temporal & Advanced)

**מטרה:** ליצור את החוקים הנותרים

**משימות:**

1. **צור `backend/rules/C1-OffHours.js`**
   - Detects: 30%+ clicks outside business hours
   - Severity: Low→Medium
   - Uses profiles.business_hours JSONB

2. **צור `backend/rules/C2-NightBurst.js`**
   - Detects: B3 + night time (00:00-06:00)
   - Severity: High
   - Combines B3 logic with time check

3. **צור `backend/rules/D1-NetworkShift.js`**
   - Detects: Unusual network switching
   - Severity: Medium
   - Checks for rapid network changes (SEARCH → DISPLAY → VIDEO)

4. **צור `backend/rules/E1-MultiRule.js`**
   - Detects: 2+ rules triggered simultaneously
   - Severity: High
   - Checks if multiple rules detected same source

5. **צור `backend/rules/E2-SuspiciousScore.js`**
   - Detects: High suspicious score (80+)
   - Severity: High
   - Calculates composite score from all detections

**Definition of Done:**
- ✅ כל 5 החוקים קיימים
- ✅ כל החוקים עובדים

---

## 📅 יום 5: עדכון run-detection.js

**מטרה:** לעדכן את ה-Job להשתמש בחוקים החדשים

**משימות:**

1. **עדכן `backend/jobs/run-detection.js`**

   **Cursor Prompt:**
   ```
   Update backend/jobs/run-detection.js:
   
   Replace DetectionEngine.detectFraud() with new rule system:
   
   1. Import all 12 rules:
      const A1_RapidRepeat = require('../rules/A1-RapidRepeat');
      const A2_ShortWindow = require('../rules/A2-ShortWindow');
      // ... all 12 rules
   
   2. Load account profile to get preset (Easy/Normal/Aggressive)
   
   3. For each account:
      - Skip if in learning_mode
      - Get clicks from last hour
      - Run each rule with account profile
      - Collect all detections
      - Save to detections table
      - Update detection_state
      - Send alerts for high-severity
   
   4. Keep existing logging and error handling
   
   Include Hebrew comments.
   ```

2. **בדיקות**
   - הרץ את ה-Job ידנית
   - בדוק שכל החוקים רצים
   - בדוק שדטקשנים נשמרים

**Definition of Done:**
- ✅ `run-detection.js` מעודכן
- ✅ כל 12 החוקים רצים
- ✅ Detections נשמרים נכון
- ✅ אין שגיאות

---

## 📅 יום 6: Monthly Report Job

**מטרה:** ליצור Job לדוחות חודשיים

**משימות:**

1. **צור `backend/jobs/generate-monthly-report.js`**

   **Cursor Prompt:**
   ```
   Create backend/jobs/generate-monthly-report.js:
   
   Scheduled job that runs on 1st of month at 00:05.
   Cron: '5 0 1 * *'
   
   Function generateMonthlyReport():
   
   1. Get all active ad_accounts
   2. For each account:
      a. Calculate last month (year, month)
      b. Get date range (start of month, end of month)
      c. Count total clicks from raw_events
      d. Count detections from detections table
      e. Count actions_taken (where action_taken IS NOT NULL)
      f. Calculate Quiet Index (use QuietIndexService)
      g. Get top 5 campaigns with most detections
      h. Calculate estimated_saved_amount (detections * avg_cost_per_click)
      i. Insert to monthly_reports table
      j. If user has whatsapp_number, send via WhatsApp (TODO for next day)
   
   3. Log job execution to job_logs
   
   Include Hebrew comments.
   Export: { generateMonthlyReport, setupCronJob }
   ```

2. **עדכן `backend/server.js`**
   - הוסף `require('./jobs/generate-monthly-report')`

3. **בדיקות**
   - הרץ את ה-Job ידנית
   - בדוק שהדוח נוצר נכון
   - בדוק שהנתונים נכונים

**Definition of Done:**
- ✅ Job קיים ועובד
- ✅ דוחות נוצרים נכון
- ✅ נתונים נכונים

---

## 📅 יום 7: WhatsApp Integration

**מטרה:** להוסיף אינטגרציה עם WhatsApp Business API

**משימות:**

1. **הגדרת WhatsApp Business Account**
   - צור Facebook Business Account
   - צור WhatsApp Business Account
   - קבל Phone Number ID + Access Token
   - הוסף ל-`.env.local`:
     ```
     WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
     WHATSAPP_ACCESS_TOKEN=your_access_token
     ```

2. **צור `backend/services/WhatsAppService.js`**

   **Cursor Prompt:**
   ```
   Create backend/services/WhatsAppService.js:
   
   Service for sending WhatsApp messages via WhatsApp Business API.
   
   Constructor:
   - phoneNumberId from env
   - accessToken from env
   - apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
   
   Methods:
   - async sendMessage(recipient, message) - sends text message
   - async sendMonthlyReport(recipient, report) - sends formatted monthly report
   - formatMonthlyReportMessage(report) - formats report as WhatsApp message
   
   Error handling:
   - Retry logic (3 attempts)
   - Logging
   - Returns { success: boolean, messageId?: string, error?: string }
   
   Include JSDoc comments in Hebrew.
   ```

3. **עדכן `generate-monthly-report.js`**
   - הוסף שליחת WhatsApp אחרי יצירת הדוח
   - עדכן `whatsapp_sent` ו-`whatsapp_sent_at` ב-monthly_reports

4. **בדיקות**
   - שלח הודעת טסט
   - בדוק שהדוח נשלח

**Definition of Done:**
- ✅ WhatsAppService קיים
- ✅ הודעות נשלחות
- ✅ דוחות חודשיים נשלחים אוטומטית

---

## 📅 יום 8: Integration & Testing

**מטרה:** לבדוק שהכל עובד יחד

**משימות:**

1. **Integration Tests**
   - הרץ את כל ה-Jobs
   - בדוק שכל החוקים עובדים
   - בדוק שדוחות נוצרים
   - בדוק ש-WhatsApp עובד

2. **Bug Fixes**
   - תקן כל באגים שנמצאו

3. **Documentation**
   - עדכן README עם החוקים החדשים
   - עדכן API Documentation

**Definition of Done:**
- ✅ כל הבדיקות עוברות
- ✅ אין באגים קריטיים
- ✅ התיעוד מעודכן

---

## ✅ Definition of Done - Final Phase

**המערכת מושלמת כאשר:**

- ✅ כל 12 חוקי הזיהוי עובדים
- ✅ Monthly Report Job יוצר דוחות אוטומטית
- ✅ WhatsApp שולח דוחות חודשיים
- ✅ Cooldown Service מונע דיווחים כפולים
- ✅ כל הבדיקות עוברות
- ✅ אין באגים קריטיים

---

## 🎉 סיום

**אחרי שתסיים את כל ה-8 הימים, המערכת תהיה מושלמת ומוכנה ל-Launch!**

**הצעד הבא:** להריץ את `LAUNCH_CHECKLIST.md` ולבדוק שהכל מוכן.

---

**תאריך יצירה:** 2026-01-11  
**עודכן על ידי:** AI Assistant
