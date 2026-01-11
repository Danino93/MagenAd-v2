-- ================================================
-- Real-time Features Setup - ימים 45-48
-- ================================================
-- גרסה בטוחה ללא DROP POLICY (ללא אזהרות)
-- ================================================

-- ================================================
-- 1. Create Activity Feed Table
-- ================================================

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

-- ================================================
-- 2. Create Indexes for Activity Feed
-- ================================================

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_read ON activity_feed(read);
CREATE INDEX IF NOT EXISTS idx_activity_feed_severity ON activity_feed(severity);
CREATE INDEX IF NOT EXISTS idx_activity_feed_account_id ON activity_feed(account_id);

-- ================================================
-- 3. Row Level Security (RLS) for Activity Feed
-- ================================================

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 4. Create Policies (Safe version - without DROP)
-- ================================================
-- אם תקבל שגיאה "policy already exists" - זה בסדר, המשך!

-- Policy: Users can view own activity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'activity_feed' 
    AND policyname = 'Users can view own activity'
  ) THEN
    CREATE POLICY "Users can view own activity"
      ON activity_feed FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policy: System can insert activity (for backend jobs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'activity_feed' 
    AND policyname = 'System can insert activity'
  ) THEN
    CREATE POLICY "System can insert activity"
      ON activity_feed FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: Users can update own activity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'activity_feed' 
    AND policyname = 'Users can update own activity'
  ) THEN
    CREATE POLICY "Users can update own activity"
      ON activity_feed FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ================================================
-- 5. Enable Realtime for Activity Feed
-- ================================================

ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;

-- ================================================
-- 6. Enable Realtime for Other Tables
-- ================================================

-- Enable Realtime for anomalies (detections)
ALTER PUBLICATION supabase_realtime ADD TABLE anomalies;

-- Enable Realtime for campaigns
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;

-- Enable Realtime for baseline_stats
ALTER PUBLICATION supabase_realtime ADD TABLE baseline_stats;

-- Enable Realtime for detection_state
ALTER PUBLICATION supabase_realtime ADD TABLE detection_state;

-- ================================================
-- 7. Add Comments
-- ================================================

COMMENT ON TABLE activity_feed IS 'User activity feed with real-time updates';
COMMENT ON COLUMN activity_feed.activity_type IS 'Type of activity: anomaly_detected, baseline_updated, etc.';
COMMENT ON COLUMN activity_feed.severity IS 'Severity level: info, warning, error, success';
COMMENT ON COLUMN activity_feed.metadata IS 'Additional metadata as JSON';

-- ================================================
-- 8. Verify Realtime Setup
-- ================================================

-- Check which tables are enabled for Realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ================================================
-- סיום
-- ================================================

-- ✅ כל הטבלאות מוכנות ל-Realtime!
-- ✅ activity_feed נוצר עם RLS
-- ✅ כל ה-Indexes נוצרו
-- ✅ Policies מוגדרות
