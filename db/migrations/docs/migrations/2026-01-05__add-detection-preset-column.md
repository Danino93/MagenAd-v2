# Migration: Add detection_preset column to ad_accounts

## תאריך
2025-02-XX

## מטרה
לאפשר בחירת רמת אגרסיביות לזיהוי קליקים (preset) לכל חשבון Google Ads.

## שינוי בדאטאבייס
- טבלה: ad_accounts
- פעולה: הוספת עמודה חדשה
- שינוי שובר לאחור: ❌ לא

## SQL שבוצע
```sql
ALTER TABLE ad_accounts
ADD COLUMN detection_preset VARCHAR(20) NOT NULL DEFAULT 'balanced'
CHECK (detection_preset IN ('conservative', 'balanced', 'sensitive'));

-- בדיקה
SELECT * FROM ad_accounts LIMIT 1;
