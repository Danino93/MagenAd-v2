/*
 * BehavioralAnalysisService.js - ניתוח התנהגותי
 * 
 * מערכת ניתוח דפוסי התנהגות:
 * - מעקב אחר משתמשים ייחודיים
 * - זיהוי דפוסים חריגים
 * - מעקב אחר מסע לקוח
 * - ניתוח זמני פעילות
 * - התנהגות חשודה
 * - פרופיל משתמש
 */

const supabase = require('../config/supabase');

class BehavioralAnalysisService {
  /**
   * ניתוח התנהגות משתמש
   */
  async analyzeUser(accountId, userId) {
    try {
      const [
        clickHistory,
        timePatterns,
        devicePatterns,
        locationPatterns
      ] = await Promise.all([
        this.getUserClickHistory(accountId, userId),
        this.analyzeTimePatterns(accountId, userId),
        this.analyzeDevicePatterns(accountId, userId),
        this.analyzeLocationPatterns(accountId, userId)
      ]);

      // חישוב ציון התנהגות
      const behaviorScore = this.calculateBehaviorScore({
        clickHistory,
        timePatterns,
        devicePatterns,
        locationPatterns
      });

      // זיהוי התנהגות חשודה
      const suspiciousFlags = this.detectSuspiciousBehavior({
        clickHistory,
        timePatterns,
        devicePatterns,
        locationPatterns
      });

      return {
        userId,
        behaviorScore,
        suspiciousFlags,
        clickHistory,
        patterns: {
          time: timePatterns,
          device: devicePatterns,
          location: locationPatterns
        },
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('שגיאה בניתוח משתמש:', error);
      throw error;
    }
  }

  /**
   * היסטוריית קליקים של משתמש
   */
  async getUserClickHistory(accountId, userId) {
    const { data } = await supabase
      .from('raw_events')
      .select('*')
      .eq('ad_account_id', accountId)
      .eq('user_id', userId)
      .eq('event_type', 'click')
      .order('event_timestamp', { ascending: false })
      .limit(100);

    const clicks = data || [];

    return {
      totalClicks: clicks.length,
      firstClick: clicks[clicks.length - 1]?.event_timestamp,
      lastClick: clicks[0]?.event_timestamp,
      avgTimeBetweenClicks: this.calculateAvgTimeBetween(clicks),
      uniqueIPs: new Set(clicks.map(c => c.ip_address)).size,
      uniqueDevices: new Set(clicks.map(c => c.device_type)).size,
      uniqueCountries: new Set(clicks.map(c => c.country_code)).size
    };
  }

  /**
   * ניתוח דפוסי זמן
   */
  async analyzeTimePatterns(accountId, userId) {
    const { data } = await supabase
      .from('raw_events')
      .select('event_timestamp')
      .eq('ad_account_id', accountId)
      .eq('user_id', userId)
      .eq('event_type', 'click')
      .order('event_timestamp', { ascending: false })
      .limit(100);

    const clicks = data || [];

    // קליקים לפי שעה ביום
    const hourDistribution = {};
    clicks.forEach(click => {
      const hour = new Date(click.event_timestamp).getHours();
      hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
    });

    // קליקים לפי יום בשבוע
    const dayDistribution = {};
    clicks.forEach(click => {
      const day = new Date(click.event_timestamp).getDay();
      dayDistribution[day] = (dayDistribution[day] || 0) + 1;
    });

    // זיהוי שעות חשודות
    const suspiciousHours = this.detectSuspiciousHours(hourDistribution);

    // זיהוי פעילות פרץ
    const burstActivity = this.detectBurstActivity(clicks);

    return {
      hourDistribution,
      dayDistribution,
      suspiciousHours,
      burstActivity,
      mostActiveHour: this.getMostActiveHour(hourDistribution),
      mostActiveDay: this.getMostActiveDay(dayDistribution)
    };
  }

  /**
   * ניתוח דפוסי מכשיר
   */
  async analyzeDevicePatterns(accountId, userId) {
    const { data } = await supabase
      .from('raw_events')
      .select('device_type, user_agent')
      .eq('ad_account_id', accountId)
      .eq('user_id', userId)
      .eq('event_type', 'click')
      .limit(100);

    const clicks = data || [];

    // התפלגות מכשירים
    const deviceDistribution = {};
    clicks.forEach(click => {
      const device = click.device_type || 'UNKNOWN';
      deviceDistribution[device] = (deviceDistribution[device] || 0) + 1;
    });

    // מספר User-Agent ייחודיים
    const uniqueUserAgents = new Set(clicks.map(c => c.user_agent)).size;

    // זיהוי החלפות מכשיר חשודות
    const suspiciousDeviceSwitching = this.detectSuspiciousDeviceSwitching(clicks);

    return {
      deviceDistribution,
      uniqueUserAgents,
      suspiciousDeviceSwitching,
      primaryDevice: this.getPrimaryDevice(deviceDistribution)
    };
  }

  /**
   * ניתוח דפוסי מיקום
   */
  async analyzeLocationPatterns(accountId, userId) {
    const { data } = await supabase
      .from('raw_events')
      .select('country_code, city, ip_address, event_timestamp')
      .eq('ad_account_id', accountId)
      .eq('user_id', userId)
      .eq('event_type', 'click')
      .order('event_timestamp', { ascending: false })
      .limit(100);

    const clicks = data || [];

    // התפלגות מדינות
    const countryDistribution = {};
    clicks.forEach(click => {
      const country = click.country_code || 'UNKNOWN';
      countryDistribution[country] = (countryDistribution[country] || 0) + 1;
    });

    // זיהוי מעברים בלתי אפשריים
    const impossibleTravel = this.detectImpossibleTravel(clicks);

    // מספר IPs ייחודיים
    const uniqueIPs = new Set(clicks.map(c => c.ip_address)).size;

    return {
      countryDistribution,
      uniqueIPs,
      impossibleTravel,
      primaryCountry: this.getPrimaryCountry(countryDistribution)
    };
  }

  /**
   * חישוב ציון התנהגות
   */
  calculateBehaviorScore(data) {
    let score = 100;

    const { clickHistory, timePatterns, devicePatterns, locationPatterns } = data;

    // קנסים
    if (clickHistory.uniqueIPs > 10) score -= 10;
    if (clickHistory.uniqueDevices > 5) score -= 10;
    if (clickHistory.uniqueCountries > 3) score -= 15;
    
    if (timePatterns.suspiciousHours.length > 0) score -= 10;
    if (timePatterns.burstActivity) score -= 15;
    
    if (devicePatterns.suspiciousDeviceSwitching) score -= 15;
    if (devicePatterns.uniqueUserAgents > 10) score -= 10;
    
    if (locationPatterns.impossibleTravel.detected) score -= 20;
    if (locationPatterns.uniqueIPs > 15) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * זיהוי התנהגות חשודה
   */
  detectSuspiciousBehavior(data) {
    const flags = [];

    const { clickHistory, timePatterns, devicePatterns, locationPatterns } = data;

    if (clickHistory.uniqueIPs > 10) {
      flags.push({
        type: 'multiple_ips',
        severity: 'high',
        message: `${clickHistory.uniqueIPs} כתובות IP שונות`
      });
    }

    if (clickHistory.avgTimeBetweenClicks < 5) {
      flags.push({
        type: 'fast_clicking',
        severity: 'high',
        message: 'זמן קצר מאוד בין קליקים'
      });
    }

    if (timePatterns.burstActivity) {
      flags.push({
        type: 'burst_activity',
        severity: 'medium',
        message: 'פעילות פרץ חשודה'
      });
    }

    if (timePatterns.suspiciousHours.length > 3) {
      flags.push({
        type: 'suspicious_hours',
        severity: 'medium',
        message: `פעילות בשעות לא שגרתיות (${timePatterns.suspiciousHours.length} שעות)`
      });
    }

    if (devicePatterns.suspiciousDeviceSwitching) {
      flags.push({
        type: 'device_switching',
        severity: 'high',
        message: 'החלפות מכשיר חשודות'
      });
    }

    if (locationPatterns.impossibleTravel.detected) {
      flags.push({
        type: 'impossible_travel',
        severity: 'critical',
        message: `מעבר בלתי אפשרי: ${locationPatterns.impossibleTravel.distance}km ב-${locationPatterns.impossibleTravel.time} דקות`
      });
    }

    return flags;
  }

  /**
   * זיהוי שעות חשודות
   */
  detectSuspiciousHours(hourDistribution) {
    const suspiciousHours = [];
    
    // שעות 0-5 בבוקר נחשבות חשודות
    for (let hour = 0; hour <= 5; hour++) {
      if (hourDistribution[hour] && hourDistribution[hour] > 3) {
        suspiciousHours.push(hour);
      }
    }

    return suspiciousHours;
  }

  /**
   * זיהוי פעילות פרץ
   */
  detectBurstActivity(clicks) {
    if (clicks.length < 5) return false;

    // בדיקה אם יש 5+ קליקים בתוך 60 שניות
    for (let i = 0; i < clicks.length - 4; i++) {
      const firstTime = new Date(clicks[i].event_timestamp);
      const fifthTime = new Date(clicks[i + 4].event_timestamp);
      const diffSeconds = Math.abs(firstTime - fifthTime) / 1000;

      if (diffSeconds < 60) {
        return true;
      }
    }

    return false;
  }

  /**
   * זיהוי החלפות מכשיר חשודות
   */
  detectSuspiciousDeviceSwitching(clicks) {
    if (clicks.length < 2) return false;

    let switches = 0;
    for (let i = 1; i < clicks.length; i++) {
      if (clicks[i].device_type !== clicks[i - 1].device_type) {
        switches++;
      }
    }

    // אם יותר מ-50% מהקליקים כוללים החלפת מכשיר
    return switches > clicks.length * 0.5;
  }

  /**
   * זיהוי מעבר בלתי אפשרי
   */
  detectImpossibleTravel(clicks) {
    if (clicks.length < 2) return { detected: false };

    // מרחקים משוערים בין מדינות (קילומטרים)
    const distances = {
      'IL-US': 10000,
      'IL-GB': 4000,
      'US-CN': 11000,
      'IL-IN': 4500
    };

    for (let i = 0; i < clicks.length - 1; i++) {
      const click1 = clicks[i];
      const click2 = clicks[i + 1];

      if (click1.country_code !== click2.country_code) {
        const time1 = new Date(click1.event_timestamp);
        const time2 = new Date(click2.event_timestamp);
        const timeDiffMinutes = Math.abs(time1 - time2) / (1000 * 60);

        // בדיקה אם המעבר בלתי אפשרי (פחות משעתיים בין מדינות רחוקות)
        const pair = `${click1.country_code}-${click2.country_code}`;
        const distance = distances[pair] || 5000; // מרחק ברירת מחדל

        // מהירות של 800 קמ"ש היא בלתי אפשרית
        const maxSpeed = 800; // קמ"ש
        const minTimeNeeded = (distance / maxSpeed) * 60; // דקות

        if (timeDiffMinutes < minTimeNeeded) {
          return {
            detected: true,
            from: click1.country_code,
            to: click2.country_code,
            distance,
            time: timeDiffMinutes.toFixed(0)
          };
        }
      }
    }

    return { detected: false };
  }

  /**
   * חישוב זמן ממוצע בין קליקים
   */
  calculateAvgTimeBetween(clicks) {
    if (clicks.length < 2) return 0;

    let totalTime = 0;
    for (let i = 1; i < clicks.length; i++) {
      const time1 = new Date(clicks[i - 1].event_timestamp);
      const time2 = new Date(clicks[i].event_timestamp);
      totalTime += Math.abs(time1 - time2) / 1000; // שניות
    }

    return (totalTime / (clicks.length - 1)).toFixed(0);
  }

  /**
   * מציאת שעה הכי פעילה
   */
  getMostActiveHour(hourDistribution) {
    let maxHour = 0;
    let maxCount = 0;

    for (const [hour, count] of Object.entries(hourDistribution)) {
      if (count > maxCount) {
        maxCount = count;
        maxHour = parseInt(hour);
      }
    }

    return maxHour;
  }

  /**
   * מציאת יום הכי פעיל
   */
  getMostActiveDay(dayDistribution) {
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    let maxDay = 0;
    let maxCount = 0;

    for (const [day, count] of Object.entries(dayDistribution)) {
      if (count > maxCount) {
        maxCount = count;
        maxDay = parseInt(day);
      }
    }

    return dayNames[maxDay];
  }

  /**
   * מציאת מכשיר ראשי
   */
  getPrimaryDevice(deviceDistribution) {
    let maxDevice = 'UNKNOWN';
    let maxCount = 0;

    for (const [device, count] of Object.entries(deviceDistribution)) {
      if (count > maxCount) {
        maxCount = count;
        maxDevice = device;
      }
    }

    return maxDevice;
  }

  /**
   * מציאת מדינה ראשית
   */
  getPrimaryCountry(countryDistribution) {
    let maxCountry = 'UNKNOWN';
    let maxCount = 0;

    for (const [country, count] of Object.entries(countryDistribution)) {
      if (count > maxCount) {
        maxCount = count;
        maxCountry = country;
      }
    }

    return maxCountry;
  }

  /**
   * ניתוח קבוצתי של משתמשים
   */
  async analyzeUserCohort(accountId, options = {}) {
    const { days = 7, limit = 100 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // שליפת משתמשים פעילים
    const { data } = await supabase
      .from('raw_events')
      .select('user_id')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString())
      .limit(limit);

    const userIds = [...new Set((data || []).map(d => d.user_id).filter(Boolean))];

    // ניתוח כל משתמש
    const analyses = [];
    for (const userId of userIds.slice(0, 20)) { // מגביל ל-20 למהירות
      try {
        const analysis = await this.analyzeUser(accountId, userId);
        analyses.push(analysis);
      } catch (error) {
        console.error(`שגיאה בניתוח משתמש ${userId}:`, error);
      }
    }

    // סיכום קבוצתי
    const cohortSummary = {
      totalUsers: userIds.length,
      analyzed: analyses.length,
      avgBehaviorScore: analyses.reduce((sum, a) => sum + a.behaviorScore, 0) / analyses.length,
      suspiciousUsers: analyses.filter(a => a.suspiciousFlags.length > 0).length,
      topFlags: this.getTopFlags(analyses)
    };

    return { cohortSummary, analyses };
  }

  /**
   * סיכום דגלים נפוצים
   */
  getTopFlags(analyses) {
    const flagCounts = {};

    analyses.forEach(analysis => {
      analysis.suspiciousFlags.forEach(flag => {
        flagCounts[flag.type] = (flagCounts[flag.type] || 0) + 1;
      });
    });

    return Object.entries(flagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }
}

module.exports = new BehavioralAnalysisService();