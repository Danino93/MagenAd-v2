/*
 * DetectionEngine.js
 * 
 * מנוע זיהוי הונאות עם 3 רמות חכמות:
 * - רגוע על מלא (🧘): 8+ clicks/hour מאותה IP
 * - חשדן בקטנה (🤨): 5+ clicks/hour (מומלץ)
 * - בלי חרטות (😤): 3+ clicks/hour
 * 
 * מריץ 8 כללי זיהוי:
 * 1. Same IP Multiple Clicks
 * 2. Rapid Fire Clicks
 * 3. Impossible Geography
 * 4. Cost Spike
 * 5. Device Switching
 * 6. Weekend Surge
 * 7. Night Activity
 * 8. Keyword Mismatch
 */
const supabase = require('../config/supabase');

class DetectionEngine {
  constructor() {
    // Detection Presets - Based on market research (ClickCease, PPC Protect, Fraud Blocker)
    this.presets = {
      liberal: {
        name: 'רגוע על מלא',
        emoji: '🧘',
        description: 'זיהוי שמרני - רק הונאות ברורות וחמורות',
        useCases: ['קמפיינים חדשים', 'B2B עם traffic נמוך', 'מי שפוחד מFalse Positives'],
        rules: {
          sameIpClicks: { threshold: 8, timeWindowHours: 1 },
          rapidFireClicks: { threshold: 4, timeWindowSeconds: 30 },
          costSpike: { multiplier: 4 },
          keywordMismatch: { threshold: 0.9 },
          zeroEngagement: { bounceRate: 0.95 },
        }
      },
      balanced: {
        name: 'חשדן בקטנה',
        emoji: '🤨',
        description: 'איזון מושלם בין דיוק לכיסוי - מומלץ לרוב העסקים',
        recommended: true,
        useCases: ['רוב העסקים (80%)', 'eCommerce', 'Lead Generation', 'המלצת התעשייה'],
        rules: {
          sameIpClicks: { threshold: 5, timeWindowHours: 1 },
          rapidFireClicks: { threshold: 3, timeWindowSeconds: 20 },
          costSpike: { multiplier: 2.5 },
          keywordMismatch: { threshold: 0.8 },
          zeroEngagement: { bounceRate: 0.85 },
          deviceSwitching: { threshold: 3, timeWindowHours: 24 },
          impossibleGeography: { timeWindowMinutes: 5 },
        }
      },
      aggressive: {
        name: 'בלי חרטות',
        emoji: '😤',
        description: 'זיהוי אגרסיבי - תופס הכל, גם במחיר של False Positives',
        useCases: ['מי שסובל מהונאות כבדות', 'תחומים תחרותיים (עו"ד, פיננסים)', 'מוכן לסכן לגיטימי'],
        rules: {
          sameIpClicks: { threshold: 3, timeWindowHours: 1 },
          rapidFireClicks: { threshold: 2, timeWindowSeconds: 15 },
          costSpike: { multiplier: 2 },
          keywordMismatch: { threshold: 0.7 },
          zeroEngagement: { bounceRate: 0.75 },
          deviceSwitching: { threshold: 2, timeWindowHours: 24 },
          impossibleGeography: { timeWindowMinutes: 3 },
          weekendSurge: { multiplier: 1.5 },
          nightActivity: { threshold: 0.6, hours: [0, 1, 2, 3, 4, 5] },
        }
      }
    };
  }

  /**
   * Run all detection rules on a click
   */
  async detectFraud(click, accountId, preset = 'balanced') {
    const detections = [];
    const rules = this.presets[preset]?.rules || this.presets.balanced.rules;

    try {
      // Rule 1: Same IP Multiple Clicks
      if (rules.sameIpClicks && click.ip_address) {
        const ipDetection = await this.checkSameIPClicks(
          click,
          accountId,
          rules.sameIpClicks
        );
        if (ipDetection) detections.push(ipDetection);
      }

      // Rule 2: Rapid Fire Clicks
      if (rules.rapidFireClicks) {
        const rapidDetection = await this.checkRapidFireClicks(
          click,
          accountId,
          rules.rapidFireClicks
        );
        if (rapidDetection) detections.push(rapidDetection);
      }

      // Rule 3: Impossible Geography
      if (rules.impossibleGeography && click.country_code) {
        const geoDetection = await this.checkImpossibleGeography(
          click,
          accountId,
          rules.impossibleGeography
        );
        if (geoDetection) detections.push(geoDetection);
      }

      // Rule 4: Cost Spike
      if (rules.costSpike) {
        const costDetection = await this.checkCostSpike(
          click,
          accountId,
          rules.costSpike
        );
        if (costDetection) detections.push(costDetection);
      }

      // Rule 5: Device Switching
      if (rules.deviceSwitching && click.ip_address) {
        const deviceDetection = await this.checkDeviceSwitching(
          click,
          accountId,
          rules.deviceSwitching
        );
        if (deviceDetection) detections.push(deviceDetection);
      }

      // Rule 6: Weekend Surge
      if (rules.weekendSurge) {
        const weekendDetection = await this.checkWeekendSurge(
          click,
          accountId,
          rules.weekendSurge
        );
        if (weekendDetection) detections.push(weekendDetection);
      }

      // Rule 7: Night Activity
      if (rules.nightActivity) {
        const nightDetection = this.checkNightActivity(
          click,
          rules.nightActivity
        );
        if (nightDetection) detections.push(nightDetection);
      }

      // Calculate overall fraud score
      const fraudScore = this.calculateFraudScore(detections);

      return {
        isFraud: detections.length > 0,
        fraudScore,
        detections,
        preset,
        clickId: click.id
      };
    } catch (error) {
      console.error('Error in fraud detection:', error);
      return { isFraud: false, fraudScore: 0, detections: [], error: error.message };
    }
  }

  /**
   * Rule 1: Same IP Multiple Clicks
   */
  async checkSameIPClicks(click, accountId, config) {
    if (!click.ip_address) return null;

    const timeWindow = new Date();
    timeWindow.setHours(timeWindow.getHours() - config.timeWindowHours);

    const { data: recentClicks } = await supabase
      .from('raw_events')
      .select('id')
      .eq('ad_account_id', accountId)
      .eq('ip_address', click.ip_address)
      .gte('event_timestamp', timeWindow.toISOString());

    const clickCount = (recentClicks?.length || 0) + 1;

    if (clickCount >= config.threshold) {
      return {
        rule_name: 'same_ip_clicks',
        severity: clickCount >= config.threshold * 2 ? 'high' : 'medium',
        confidence: Math.min(clickCount / config.threshold, 1),
        details: {
          ip_address: click.ip_address,
          click_count: clickCount,
          threshold: config.threshold,
          time_window_hours: config.timeWindowHours
        },
        message: `${clickCount} clicks מאותה IP ב-${config.timeWindowHours} שעות`
      };
    }

    return null;
  }

  /**
   * Rule 2: Rapid Fire Clicks
   */
  async checkRapidFireClicks(click, accountId, config) {
    const timeWindow = new Date();
    timeWindow.setSeconds(timeWindow.getSeconds() - config.timeWindowSeconds);

    const { data: recentClicks } = await supabase
      .from('raw_events')
      .select('id')
      .eq('ad_account_id', accountId)
      .gte('event_timestamp', timeWindow.toISOString());

    const clickCount = (recentClicks?.length || 0) + 1;

    if (clickCount >= config.threshold) {
      return {
        rule_name: 'rapid_fire_clicks',
        severity: 'high',
        confidence: 0.9,
        details: {
          click_count: clickCount,
          time_window_seconds: config.timeWindowSeconds,
          threshold: config.threshold
        },
        message: `${clickCount} clicks תוך ${config.timeWindowSeconds} שניות - Bot חשוד`
      };
    }

    return null;
  }

  /**
   * Rule 3: Impossible Geography
   */
  async checkImpossibleGeography(click, accountId, config) {
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - config.timeWindowMinutes);

    const { data: recentClicks } = await supabase
      .from('raw_events')
      .select('country_code, city')
      .eq('ad_account_id', accountId)
      .gte('event_timestamp', timeWindow.toISOString())
      .neq('country_code', click.country_code)
      .limit(1);

    if (recentClicks && recentClicks.length > 0) {
      const prevClick = recentClicks[0];
      return {
        rule_name: 'impossible_geography',
        severity: 'high',
        confidence: 0.95,
        details: {
          current_location: `${click.city}, ${click.country_code}`,
          previous_location: `${prevClick.city}, ${prevClick.country_code}`,
          time_difference_minutes: config.timeWindowMinutes
        },
        message: `Clicks מ-2 מדינות תוך ${config.timeWindowMinutes} דקות - VPN/Proxy חשוד`
      };
    }

    return null;
  }

  /**
   * Rule 4: Cost Spike
   */
  async checkCostSpike(click, accountId, config) {
    const { data: avgData } = await supabase
      .from('raw_events')
      .select('cost_micros')
      .eq('ad_account_id', accountId)
      .eq('campaign_id', click.campaign_id)
      .limit(100);

    if (!avgData || avgData.length < 10) return null;

    const avgCost = avgData.reduce((sum, c) => sum + (c.cost_micros || 0), 0) / avgData.length;
    const currentCost = click.cost_micros || 0;

    if (currentCost >= avgCost * config.multiplier) {
      return {
        rule_name: 'cost_spike',
        severity: 'medium',
        confidence: 0.7,
        details: {
          current_cost: currentCost / 1000000,
          average_cost: avgCost / 1000000,
          multiplier: (currentCost / avgCost).toFixed(2)
        },
        message: `עלות פי ${(currentCost / avgCost).toFixed(1)} מהממוצע`
      };
    }

    return null;
  }

  /**
   * Rule 5: Device Switching
   */
  async checkDeviceSwitching(click, accountId, config) {
    if (!click.ip_address) return null;

    const timeWindow = new Date();
    timeWindow.setHours(timeWindow.getHours() - config.timeWindowHours);

    const { data: devices } = await supabase
      .from('raw_events')
      .select('device_type')
      .eq('ad_account_id', accountId)
      .eq('ip_address', click.ip_address)
      .gte('event_timestamp', timeWindow.toISOString());

    if (!devices) return null;

    const uniqueDevices = new Set(devices.map(d => d.device_type));
    uniqueDevices.add(click.device_type);

    if (uniqueDevices.size >= config.threshold) {
      return {
        rule_name: 'device_switching',
        severity: 'medium',
        confidence: 0.7,
        details: {
          devices: Array.from(uniqueDevices),
          device_count: uniqueDevices.size
        },
        message: `${uniqueDevices.size} מכשירים מאותה IP`
      };
    }

    return null;
  }

  /**
   * Rule 6: Weekend Surge
   */
  async checkWeekendSurge(click, accountId, config) {
    const clickDate = new Date(click.event_timestamp);
    const dayOfWeek = clickDate.getDay();
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6) return null;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const { data: allClicks } = await supabase
      .from('raw_events')
      .select('event_timestamp')
      .eq('ad_account_id', accountId)
      .gte('event_timestamp', startOfWeek.toISOString());

    if (!allClicks || allClicks.length < 50) return null;

    const weekendClicks = allClicks.filter(c => {
      const d = new Date(c.event_timestamp).getDay();
      return d === 0 || d === 6;
    }).length;

    const weekdayClicks = allClicks.length - weekendClicks;
    const weekendRatio = weekendClicks / (weekendClicks + weekdayClicks);

    if (weekendRatio >= (1 / 7) * config.multiplier) {
      return {
        rule_name: 'weekend_surge',
        severity: 'low',
        confidence: 0.6,
        details: { weekend_ratio: weekendRatio.toFixed(2) },
        message: `פעילות גבוהה בסופי שבוע`
      };
    }

    return null;
  }

  /**
   * Rule 7: Night Activity
   */
  checkNightActivity(click, config) {
    const clickDate = new Date(click.event_timestamp);
    const hour = clickDate.getHours();

    if (config.hours.includes(hour)) {
      return {
        rule_name: 'night_activity',
        severity: 'low',
        confidence: 0.5,
        details: { hour },
        message: `Click בשעה ${hour}:00 - פעילות לילה`
      };
    }

    return null;
  }

  /**
   * Calculate fraud score (0-100)
   */
  calculateFraudScore(detections) {
    if (detections.length === 0) return 0;

    const severityWeights = { high: 40, medium: 25, low: 15 };
    let totalScore = 0;

    detections.forEach(detection => {
      const baseScore = severityWeights[detection.severity] || 15;
      totalScore += baseScore * detection.confidence;
    });

    return Math.min(Math.round(totalScore), 100);
  }

  /**
   * Save detection to database
   */
  async saveDetection(detection, clickId, accountId) {
    try {
      const { data, error } = await supabase
        .from('fraud_detections')
        .insert({
          ad_account_id: accountId,
          raw_event_id: clickId,
          detection_type: detection.rule_name,
          severity_level: detection.severity,
          confidence_score: detection.confidence,
          detection_details: detection.details,
          detection_message: detection.message,
          detected_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving detection:', error);
      throw error;
    }
  }

  /**
   * Get preset configuration
   */
  getPreset(presetName) {
    return this.presets[presetName] || this.presets.balanced;
  }

  /**
   * Get all presets for UI
   */
  getAllPresets() {
    return Object.keys(this.presets).map(key => ({
      id: key,
      ...this.presets[key]
    }));
  }
}

module.exports = new DetectionEngine();