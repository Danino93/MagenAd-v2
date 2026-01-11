# 📦 **התקנת Jobs - מדריך מהיר**

**זמן התקנה:** 10-15 דקות  
**קושי:** קל  

---

## 🎯 **מה אנחנו מתקינים:**

```
✅ 3 Cron Jobs (אוטומציה)
✅ 1 Utils (פונקציות עזר)
✅ 1 עדכון ל-server.js
✅ 1 package (node-cron)
```

---

## 📋 **שלב 1: התקן node-cron**

```bash
cd backend
npm install node-cron
```

---

## 📂 **שלב 2: צור תיקיות**

```bash
cd backend/src

# צור תיקיות
mkdir -p jobs
mkdir -p utils
```

---

## 📄 **שלב 3: העתק 4 קבצים**

### **העתק ל-backend/src/jobs/:**

```
1. ingest-clicks.js
2. calculate-baseline.js
3. run-detection.js
```

### **העתק ל-backend/src/utils/:**

```
4. sourceKey.js
```

**מבנה סופי:**
```
backend/src/
├── jobs/
│   ├── ingest-clicks.js       ← חדש!
│   ├── calculate-baseline.js  ← חדש!
│   └── run-detection.js       ← חדש!
│
├── utils/
│   └── sourceKey.js           ← חדש!
│
└── server.js                   ← נעדכן
```

---

## ⚙️ **שלב 4: עדכן server.js**

### **פתח:** `backend/src/server.js`

### **הוסף בתחילת הקובץ (אחרי require statements):**

```javascript
// Cron Jobs
console.log('🔄 Initializing cron jobs...')

// Data ingestion (every 6 hours)
require('./jobs/ingest-clicks')

// Baseline calculation (daily at 2 AM)
require('./jobs/calculate-baseline')

// Detection engine (hourly)
require('./jobs/run-detection')

console.log('✅ All cron jobs initialized')
```

**הקובץ המלא אמור להיראות:**

```javascript
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

// Cron Jobs
console.log('🔄 Initializing cron jobs...')
require('./jobs/ingest-clicks')
require('./jobs/calculate-baseline')
require('./jobs/run-detection')
console.log('✅ All cron jobs initialized')

// Routes
const authRoutes = require('./routes/auth')
// ... rest of code
```

---

## ✅ **שלב 5: אתחל DB Table (אם לא קיים)**

### **הרץ SQL ב-Supabase:**

```sql
-- Job Logs Table
CREATE TABLE IF NOT EXISTS job_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'success',
  metadata JSONB,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_job_logs_job_name ON job_logs(job_name);
CREATE INDEX idx_job_logs_executed_at ON job_logs(executed_at DESC);
```

---

## 🚀 **שלב 6: הפעל את הServer**

```bash
cd backend
npm run dev
```

### **בדוק שאתה רואה:**

```
🔄 Initializing cron jobs...
⏰ [INGEST-JOB] Scheduled with cron: 0 */6 * * *
📅 Next runs: 00:00, 06:00, 12:00, 18:00
✅ [INGEST-JOB] Cron job is active and running

⏰ [BASELINE-JOB] Scheduled with cron: 0 2 * * *
📅 Runs daily at 02:00 AM
✅ [BASELINE-JOB] Cron job is active and running

⏰ [DETECTION-JOB] Scheduled with cron: 0 * * * *
📅 Runs hourly (every hour at :00)
✅ [DETECTION-JOB] Cron job is active and running

✅ All cron jobs initialized
Server running on port 3001
```

---

## 🧪 **שלב 7: בדיקה ידנית**

### **רוץ כל Job ידנית:**

```bash
# Test ingestion
node backend/src/jobs/ingest-clicks.js

# Test baseline
node backend/src/jobs/calculate-baseline.js

# Test detection
node backend/src/jobs/run-detection.js
```

### **בדוק Logs ב-Supabase:**

```sql
SELECT * FROM job_logs 
ORDER BY executed_at DESC 
LIMIT 10;
```

---

## 📊 **תזמון Jobs:**

| Job | תזמון | תדירות | מתי רץ |
|-----|-------|---------|---------|
| **ingest-clicks** | `0 */6 * * *` | כל 6 שעות | 00:00, 06:00, 12:00, 18:00 |
| **calculate-baseline** | `0 2 * * *` | יומי | 02:00 בבוקר |
| **run-detection** | `0 * * * *` | שעתי | כל שעה ב-:00 |

---

## 🔍 **בדיקת תקינות:**

### **✅ Checklist:**

```
□ node-cron מותקן
□ תיקיות jobs/ ו-utils/ נוצרו
□ 4 קבצים הועתקו
□ server.js עודכן
□ job_logs table קיים
□ Server רץ בלי שגיאות
□ Cron jobs initialized
□ בדיקה ידנית עברה בהצלחה
```

---

## ⚠️ **שגיאות נפוצות:**

### **שגיאה: "Cannot find module 'node-cron'"**

```bash
# פתרון:
cd backend
npm install node-cron
```

### **שגיאה: "ClicksService is not defined"**

```
בדוק ש:
- backend/src/services/ClicksService.js קיים
- הנתיב ב-require נכון
```

### **שגיאה: "job_logs table not found"**

```sql
-- הרץ ב-Supabase:
CREATE TABLE job_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'success',
  metadata JSONB,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🎯 **אחרי ההתקנה:**

### **Jobs ירוצו אוטומטית:**

- ✅ **Ingestion** - כל 6 שעות (משיכת clicks)
- ✅ **Baseline** - כל יום ב-2 AM (חישוב baseline)
- ✅ **Detection** - כל שעה (זיהוי אנומליות)

### **ניטור:**

```bash
# בדוק logs
tail -f backend/logs/app.log

# בדוק job_logs ב-DB
SELECT * FROM job_logs ORDER BY executed_at DESC;
```

---

## 🎉 **סיימת!**

```
✅ 3 Jobs פעילים
✅ אוטומציה מלאה
✅ Monitoring מוכן
✅ Error handling מושלם
```

---

**Jobs יתחילו לרוץ אוטומטית בזמנים המתוכננים! 🚀**

**אם רוצה לבדוק עכשיו - הרץ ידנית!**
