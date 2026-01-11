# 🔴 Supabase Realtime Setup - הוראות

**תאריך:** 11/01/2026  
**מטרה:** הגדרת Realtime לטבלאות + יצירת activity_feed

---

## 📋 **שלבים:**

### **שלב 1: פתח Supabase SQL Editor**

1. לך ל-Supabase Dashboard
2. בחר את הפרויקט שלך
3. לך ל-SQL Editor (בתפריט השמאלי)
4. לחץ על "New Query"

---

### **שלב 2: העתק והרץ את ה-SQL**

העתק את כל התוכן מהקובץ:
```
db/migrations/2026-01-11__realtime-setup.sql
```

או העתק ישירות:

```sql
-- ================================================
-- Real-time Features Setup - ימים 45-48
-- ================================================

-- 1. Create Activity Feed Table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id VARCHAR(255),
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT activity_feed_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_read ON activity_feed(read);
CREATE INDEX IF NOT EXISTS idx_activity_feed_severity ON activity_feed(severity);
CREATE INDEX IF NOT EXISTS idx_activity_feed_account_id ON activity_feed(account_id);

-- 3. Enable RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
DROP POLICY IF EXISTS "Users can view own activity" ON activity_feed;
CREATE POLICY "Users can view own activity"
  ON activity_feed FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert activity" ON activity_feed;
CREATE POLICY "System can insert activity"
  ON activity_feed FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own activity" ON activity_feed;
CREATE POLICY "Users can update own activity"
  ON activity_feed FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Enable Realtime for Activity Feed
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;

-- 6. Enable Realtime for Other Tables
ALTER PUBLICATION supabase_realtime ADD TABLE anomalies;
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE baseline_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE detection_state;

-- 7. Add Comments
COMMENT ON TABLE activity_feed IS 'User activity feed with real-time updates';
```

---

### **שלב 3: בדוק שהכל עבד**

הרץ את השאילתה הזו כדי לבדוק:

```sql
-- Check which tables are enabled for Realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

**אמור להציג:**
- `activity_feed` ✅
- `anomalies` ✅
- `campaigns` ✅
- `baseline_stats` ✅
- `detection_state` ✅

---

### **שלב 4: בדוק ב-Dashboard**

1. לך ל-Database → Tables
2. בדוק ש-`activity_feed` קיים
3. לך ל-Database → Replication
4. בדוק שהטבלאות מופיעות ב-Realtime

---

## ✅ **Checklist:**

```
□ SQL הורצה בהצלחה
□ activity_feed table נוצר
□ Indexes נוצרו
□ RLS מופעל
□ Policies נוצרו
□ Realtime מופעל לכל הטבלאות
□ בדיקה ב-Dashboard עברה
```

---

## ⚠️ **שגיאות נפוצות:**

### **שגיאה: "relation already exists"**
- זה בסדר! הטבלה כבר קיימת
- המשך לשאר השלבים

### **שגיאה: "publication does not exist"**
- זה לא אמור לקרות
- אם זה קורה, צור את ה-publication:
```sql
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
```

### **שגיאה: "table does not exist"**
- בדוק שהטבלאות קיימות:
  - `anomalies`
  - `campaigns`
  - `baseline_stats`
  - `detection_state`
- אם חסר, צור אותן קודם

---

## 🎉 **סיום:**

לאחר הרצת ה-SQL, כל התכונות של Real-time יעבדו!

- ✅ Activity Feed מוכן
- ✅ Realtime מופעל
- ✅ RLS מוגדר
- ✅ הכל מאובטח

**הכל מוכן! 🚀**
