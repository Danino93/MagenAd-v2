# Migration: Create quiet_index_history

## תאריך
2025-02-XX

## מטרה
שמירת היסטוריה של חישובי Quiet Index לכל חשבון Ads כדי להציג גרף/טרנדים ולייצר דוחות חודשיים.

## שינוי בדאטאבייס
- פעולה: יצירת טבלה חדשה + אינדקסים
- טבלה: quiet_index_history
- שינוי שובר לאחור: ❌ לא

## SQL שבוצע
```sql
-- טבלת quiet_index_history (מתוקן ל-UUID)
-- שומרת היסטוריה של חישובי Quiet Index

CREATE TABLE IF NOT EXISTS quiet_index_history (
  id BIGSERIAL PRIMARY KEY,
  ad_account_id UUID REFERENCES ad_accounts(id) ON DELETE CASCADE,  -- ← UUID במקום BIGINT
  
  -- QI Score
  qi_score INTEGER NOT NULL CHECK (qi_score >= 0 AND qi_score <= 100),
  
  -- Click Stats
  total_clicks INTEGER NOT NULL DEFAULT 0,
  clean_clicks INTEGER NOT NULL DEFAULT 0,
  fraud_clicks INTEGER NOT NULL DEFAULT 0,
  
  -- Fraud Score
  avg_fraud_score DECIMAL(5,2) DEFAULT 0,
  
  -- Detection Breakdown (JSON)
  detection_breakdown JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_account_calculation UNIQUE(ad_account_id, calculated_at)
);

-- Indexes לperformance
CREATE INDEX idx_qi_history_account ON quiet_index_history(ad_account_id);
CREATE INDEX idx_qi_history_calculated ON quiet_index_history(calculated_at DESC);
CREATE INDEX idx_qi_history_account_time ON quiet_index_history(ad_account_id, calculated_at DESC);

-- Comment
COMMENT ON TABLE quiet_index_history IS 'Quiet Index™ history - tracking click quality over time';