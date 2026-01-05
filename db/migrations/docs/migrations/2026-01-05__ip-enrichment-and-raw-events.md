# Migration: IP enrichment and raw_events extension

## תאריך
2026-01-05

## מטרה
הוספת שכבת IP intelligence למערכת:
- טבלת ip_enrichments לשמירת מידע מועשר על כתובות IP
- הרחבת raw_events עם נתוני IP בסיסיים לצורכי זיהוי וניתוח

## שינוי בדאטאבייס
- יצירת טבלה חדשה: ip_enrichments
- הוספת עמודות ל-raw_events
- שינוי שובר לאחור: ❌ לא

## שימוש במערכת
- raw_events:
  - נשמר IP snapshot ברמת event
- ip_enrichments:
  - משמש כ-cache חכם ל-IP enrichment
  - מאפשר ניתוח היסטורי, reuse והרחבות עתידיות

## תאימות לאחור
✔️ מלאה  
אירועים קיימים נשארים ללא שינוי (ברירת מחדל בטוחה).

## הערות ארכיטקטורה
- raw_events = snapshot בזמן קליק
- ip_enrichments = מקור אמת מועשר
- אין foreign key ביניהם (בכוונה) כדי למנוע coupling

## Rollback
```sql
DROP TABLE IF EXISTS ip_enrichments;

ALTER TABLE raw_events
DROP COLUMN IF EXISTS ip_address,
DROP COLUMN IF EXISTS isp,
DROP COLUMN IF EXISTS organization,
DROP COLUMN IF EXISTS is_vpn,
DROP COLUMN IF EXISTS is_proxy,
DROP COLUMN IF EXISTS is_hosting,
DROP COLUMN IF EXISTS risk_score;



-- Migration: IP enrichment + raw_events extensions
-- Date: 2026-01-05
-- Purpose: Store enriched IP intelligence and attach it to raw click events

-- ==================================================
-- 1. Create ip_enrichments table
-- ==================================================

CREATE TABLE IF NOT EXISTS ip_enrichments (
  id BIGSERIAL PRIMARY KEY,

  -- IP Address (unique)
  ip_address VARCHAR(45) UNIQUE NOT NULL,

  -- Geographic Data
  country VARCHAR(100),
  country_code VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  timezone VARCHAR(50),

  -- Network Data
  isp VARCHAR(255),
  organization VARCHAR(255),
  asn VARCHAR(100),

  -- Security Flags
  is_vpn BOOLEAN NOT NULL DEFAULT FALSE,
  is_proxy BOOLEAN NOT NULL DEFAULT FALSE,
  is_hosting BOOLEAN NOT NULL DEFAULT FALSE,
  is_tor BOOLEAN NOT NULL DEFAULT FALSE,

  -- Risk Assessment
  risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level VARCHAR(20) NOT NULL DEFAULT 'safe',

  -- Metadata
  enriched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes (performance)
CREATE INDEX IF NOT EXISTS idx_ip_enrichments_ip
  ON ip_enrichments(ip_address);

CREATE INDEX IF NOT EXISTS idx_ip_enrichments_country
  ON ip_enrichments(country_code);

CREATE INDEX IF NOT EXISTS idx_ip_enrichments_risk
  ON ip_enrichments(risk_level);

CREATE INDEX IF NOT EXISTS idx_ip_enrichments_vpn
  ON ip_enrichments(is_vpn)
  WHERE is_vpn = TRUE;

CREATE INDEX IF NOT EXISTS idx_ip_enrichments_hosting
  ON ip_enrichments(is_hosting)
  WHERE is_hosting = TRUE;

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_ip_enrichments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ip_enrichments_updated_at ON ip_enrichments;

CREATE TRIGGER ip_enrichments_updated_at
BEFORE UPDATE ON ip_enrichments
FOR EACH ROW
EXECUTE FUNCTION update_ip_enrichments_updated_at();

COMMENT ON TABLE ip_enrichments IS
'IP enrichment data - GeoIP, ISP, VPN detection, TOR, hosting and risk scoring';


-- ==================================================
-- 2. Extend raw_events with IP enrichment fields
-- ==================================================

ALTER TABLE raw_events
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS isp VARCHAR(255),
ADD COLUMN IF NOT EXISTS organization VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_vpn BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_proxy BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_hosting BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_raw_events_ip
  ON raw_events(ip_address);

CREATE INDEX IF NOT EXISTS idx_raw_events_vpn
  ON raw_events(is_vpn)
  WHERE is_vpn = TRUE;

CREATE INDEX IF NOT EXISTS idx_raw_events_risk
  ON raw_events(risk_score)
  WHERE risk_score > 0;

-- Column comments
COMMENT ON COLUMN raw_events.ip_address IS 'IP address of the click event';
COMMENT ON COLUMN raw_events.isp IS 'Internet Service Provider';
COMMENT ON COLUMN raw_events.organization IS 'Organization owning the IP';
COMMENT ON COLUMN raw_events.is_vpn IS 'Indicates VPN or proxy usage';
COMMENT ON COLUMN raw_events.is_hosting IS 'Indicates data center / hosting IP';
COMMENT ON COLUMN raw_events.risk_score IS 'Risk score (0-100)';
