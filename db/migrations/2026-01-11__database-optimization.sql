-- ================================================
-- Database Indexes Optimization
-- ================================================
-- תאריך: 11/01/2026
-- מטרה: אופטימיזציה של מסד הנתונים
-- ================================================

-- Composite indexes for common queries
-- Note: raw_events uses ad_account_id, not user_id directly
CREATE INDEX IF NOT EXISTS idx_raw_events_account_time 
  ON raw_events(ad_account_id, click_timestamp DESC);

-- Note: detections uses ad_account_id, not user_id directly
CREATE INDEX IF NOT EXISTS idx_detections_account_severity 
  ON detections(ad_account_id, severity);

CREATE INDEX IF NOT EXISTS idx_detections_account_detected 
  ON detections(ad_account_id, detected_at DESC);

-- Partial indexes for active data (detections without action_taken)
CREATE INDEX IF NOT EXISTS idx_detections_active 
  ON detections(ad_account_id, detected_at DESC) 
  WHERE action_taken IS NULL;

-- Note: ad_accounts uses user_id
CREATE INDEX IF NOT EXISTS idx_ad_accounts_user_active 
  ON ad_accounts(user_id, created_at DESC) 
  WHERE is_active = true;

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_detections_evidence_gin 
  ON detections USING GIN (evidence);

-- Note: metadata column doesn't exist in raw_events table
-- CREATE INDEX IF NOT EXISTS idx_raw_events_metadata_gin 
--   ON raw_events USING GIN (metadata);

-- Covering indexes (include commonly selected columns)
CREATE INDEX IF NOT EXISTS idx_detections_cover 
  ON detections(ad_account_id, detected_at DESC) 
  INCLUDE (severity, rule_name, action_taken);

-- Indexes for geographic queries
-- Note: ip_address column doesn't exist in raw_events table
-- CREATE INDEX IF NOT EXISTS idx_raw_events_ip 
--   ON raw_events(ip_address) 
--   WHERE ip_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_raw_events_country 
  ON raw_events(country_code) 
  WHERE country_code IS NOT NULL;

-- Indexes for time-based queries
-- Note: DATE() function is not IMMUTABLE, so we use date_trunc instead
CREATE INDEX IF NOT EXISTS idx_raw_events_date 
  ON raw_events(date_trunc('day', click_timestamp));

CREATE INDEX IF NOT EXISTS idx_detections_date 
  ON detections(date_trunc('day', detected_at));

-- Indexes for job_logs
CREATE INDEX IF NOT EXISTS idx_job_logs_job_name_executed 
  ON job_logs(job_name, executed_at DESC);

-- Index for ad_accounts user_id (for faster joins in get_dashboard_stats)
CREATE INDEX IF NOT EXISTS idx_ad_accounts_user_id 
  ON ad_accounts(user_id);

-- Verify indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ================================================
-- Optimized Dashboard Stats Function
-- ================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS TABLE(
  total_campaigns BIGINT,
  total_anomalies BIGINT,
  high_severity BIGINT,
  resolved_anomalies BIGINT,
  total_clicks BIGINT,
  total_cost NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Count active ad accounts (these are the "campaigns" in our system)
    (SELECT COUNT(*) 
     FROM ad_accounts aa
     WHERE aa.user_id = p_user_id AND aa.is_active = true),
    
    -- Count all detections (through ad_accounts)
    (SELECT COUNT(*) 
     FROM detections d
     INNER JOIN ad_accounts aa ON d.ad_account_id = aa.id
     WHERE aa.user_id = p_user_id),
    
    -- Count high severity detections (through ad_accounts)
    (SELECT COUNT(*) 
     FROM detections d
     INNER JOIN ad_accounts aa ON d.ad_account_id = aa.id
     WHERE aa.user_id = p_user_id AND d.severity = 'high'),
    
    -- Count resolved detections (through ad_accounts - using action_taken)
    (SELECT COUNT(*) 
     FROM detections d
     INNER JOIN ad_accounts aa ON d.ad_account_id = aa.id
     WHERE aa.user_id = p_user_id AND d.action_taken IS NOT NULL),
    
    -- Count total clicks (through ad_accounts)
    (SELECT COUNT(*) 
     FROM raw_events re
     INNER JOIN ad_accounts aa ON re.ad_account_id = aa.id
     WHERE aa.user_id = p_user_id),
    
    -- Sum total cost (through ad_accounts)
    (SELECT COALESCE(SUM(re.cost_micros::NUMERIC / 1000000), 0) 
     FROM raw_events re
     INNER JOIN ad_accounts aa ON re.ad_account_id = aa.id
     WHERE aa.user_id = p_user_id);
END;
$$;

COMMENT ON FUNCTION get_dashboard_stats IS 'Optimized dashboard stats aggregation function';
