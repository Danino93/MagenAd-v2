/*
 * MLService.js - שירות למידת מכונה
 * 
 * מערכת חיזוי הונאות מבוססת ML:
 * - אימון מודל על נתונים היסטוריים
 * - חיזוי הונאות בזמן אמת
 * - עדכון מודל אוטומטי
 * - דירוג סיכון משופר
 * - ניתוח דפוסים
 * - מדדי ביצועים
 */

const supabase = require('../config/supabase');

class MLService {
  constructor() {
    this.model = null;
    this.features = [
      'hour_of_day',
      'day_of_week',
      'is_vpn',
      'is_hosting',
      'risk_score',
      'country_risk',
      'time_since_last_click',
      'clicks_from_ip',
      'device_type_encoded'
    ];
  }

  /**
   * אימון המודל על נתונים היסטוריים
   */
  async trainModel(accountId) {
    try {
      console.log('🤖 מתחיל אימון מודל...');

      // שליפת נתונים לאימון
      const trainingData = await this.getTrainingData(accountId);

      if (trainingData.length < 100) {
        console.log('⚠️ לא מספיק נתונים לאימון (צריך לפחות 100)');
        return null;
      }

      // הכנת פיצ'רים
      const features = trainingData.map(d => this.extractFeatures(d));
      const labels = trainingData.map(d => d.is_fraud ? 1 : 0);

      // אלגוריתם פשוט - Logistic Regression מדומה
      const model = this.simpleLogisticRegression(features, labels);

      // שמירת המודל
      await this.saveModel(accountId, model);

      // חישוב מדדי ביצועים
      const metrics = this.calculateMetrics(features, labels, model);

      console.log('✅ אימון הושלם!', metrics);

      return { model, metrics };
    } catch (error) {
      console.error('שגיאה באימון מודל:', error);
      throw error;
    }
  }

  /**
   * שליפת נתונים לאימון
   */
  async getTrainingData(accountId) {
    try {
      // שליפת קליקים עם תוויות הונאה
      const { data: clicks } = await supabase
        .from('raw_events')
        .select(`
          *,
          fraud_detections:fraud_detections(id, fraud_score)
        `)
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .order('event_timestamp', { ascending: false })
        .limit(5000);

      // סימון קליקים כהונאה או לגיטימיים
      const labeled = (clicks || []).map(click => ({
        ...click,
        is_fraud: click.fraud_detections && click.fraud_detections.length > 0
      }));

      return labeled;
    } catch (error) {
      console.error('שגיאה בשליפת נתוני אימון:', error);
      return [];
    }
  }

  /**
   * חילוץ פיצ'רים מקליק
   */
  extractFeatures(click) {
    const timestamp = new Date(click.event_timestamp);
    
    return {
      hour_of_day: timestamp.getHours(),
      day_of_week: timestamp.getDay(),
      is_vpn: click.is_vpn ? 1 : 0,
      is_hosting: click.is_hosting ? 1 : 0,
      risk_score: click.risk_score || 0,
      country_risk: this.getCountryRisk(click.country_code),
      time_since_last_click: 0, // יחושב בזמן אמת
      clicks_from_ip: 1, // יחושב בזמן אמת
      device_type_encoded: this.encodeDeviceType(click.device_type)
    };
  }

  /**
   * קידוד סוג מכשיר
   */
  encodeDeviceType(deviceType) {
    const mapping = {
      'MOBILE': 0,
      'DESKTOP': 1,
      'TABLET': 2,
      'UNKNOWN': 3
    };
    return mapping[deviceType] || 3;
  }

  /**
   * דירוג סיכון לפי מדינה
   */
  getCountryRisk(countryCode) {
    const highRisk = ['CN', 'RU', 'VN', 'IN', 'BD', 'PK'];
    const mediumRisk = ['BR', 'TR', 'ID', 'NG', 'PH'];
    
    if (highRisk.includes(countryCode)) return 3;
    if (mediumRisk.includes(countryCode)) return 2;
    return 1;
  }

  /**
   * אלגוריתם רגרסיה לוגיסטית פשוט
   */
  simpleLogisticRegression(features, labels) {
    // משקולות התחלתיים
    const weights = new Array(this.features.length).fill(0);
    const learningRate = 0.01;
    const iterations = 1000;

    // אימון
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < features.length; i++) {
        const feature = Object.values(features[i]);
        const prediction = this.sigmoid(this.dotProduct(weights, feature));
        const error = labels[i] - prediction;

        // עדכון משקולות
        for (let j = 0; j < weights.length; j++) {
          weights[j] += learningRate * error * feature[j];
        }
      }
    }

    return { weights, threshold: 0.5 };
  }

  /**
   * פונקציית סיגמואיד
   */
  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * מכפלה נקודתית
   */
  dotProduct(weights, features) {
    return weights.reduce((sum, w, i) => sum + w * features[i], 0);
  }

  /**
   * חיזוי הונאה לקליק בודד
   */
  async predictFraud(accountId, click) {
    try {
      // טעינת המודל
      const model = await this.loadModel(accountId);
      
      if (!model) {
        console.log('אין מודל זמין, משתמש בשיטה בסיסית');
        return this.basicPrediction(click);
      }

      // חילוץ פיצ'רים
      const features = await this.extractRealTimeFeatures(accountId, click);
      const featureValues = Object.values(features);

      // חיזוי
      const score = this.sigmoid(this.dotProduct(model.weights, featureValues));
      const isFraud = score > model.threshold;

      return {
        isFraud,
        fraudProbability: (score * 100).toFixed(1),
        confidence: Math.abs(score - 0.5) * 2 * 100,
        features
      };
    } catch (error) {
      console.error('שגיאה בחיזוי:', error);
      return this.basicPrediction(click);
    }
  }

  /**
   * חילוץ פיצ'רים בזמן אמת
   */
  async extractRealTimeFeatures(accountId, click) {
    const baseFeatures = this.extractFeatures(click);

    // חישוב פיצ'רים דינמיים
    const [timeSinceLast, clicksFromIP] = await Promise.all([
      this.getTimeSinceLastClick(accountId, click.ip_address),
      this.getClicksFromIP(accountId, click.ip_address)
    ]);

    return {
      ...baseFeatures,
      time_since_last_click: timeSinceLast,
      clicks_from_ip: clicksFromIP
    };
  }

  /**
   * זמן מאז קליק אחרון מאותו IP
   */
  async getTimeSinceLastClick(accountId, ipAddress) {
    const { data } = await supabase
      .from('raw_events')
      .select('event_timestamp')
      .eq('ad_account_id', accountId)
      .eq('ip_address', ipAddress)
      .eq('event_type', 'click')
      .order('event_timestamp', { ascending: false })
      .limit(2);

    if (!data || data.length < 2) return 9999;

    const diff = new Date(data[0].event_timestamp) - new Date(data[1].event_timestamp);
    return Math.floor(diff / 1000); // בשניות
  }

  /**
   * מספר קליקים מאותו IP
   */
  async getClicksFromIP(accountId, ipAddress) {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count } = await supabase
      .from('raw_events')
      .select('id', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .eq('ip_address', ipAddress)
      .eq('event_type', 'click')
      .gte('event_timestamp', last24h.toISOString());

    return count || 0;
  }

  /**
   * חיזוי בסיסי (fallback)
   */
  basicPrediction(click) {
    let score = 0;

    if (click.is_vpn) score += 30;
    if (click.is_hosting) score += 25;
    if (click.risk_score > 70) score += 30;
    
    const hour = new Date(click.event_timestamp).getHours();
    if (hour >= 0 && hour <= 5) score += 15;

    return {
      isFraud: score > 50,
      fraudProbability: Math.min(score, 100).toFixed(1),
      confidence: 'low',
      features: { basic: true }
    };
  }

  /**
   * שמירת מודל
   */
  async saveModel(accountId, model) {
    try {
      const { error } = await supabase
        .from('ml_models')
        .upsert({
          ad_account_id: accountId,
          model_type: 'fraud_detection',
          model_data: model,
          trained_at: new Date().toISOString(),
          status: 'active'
        });

      if (error) throw error;
      console.log('✅ מודל נשמר בהצלחה');
    } catch (error) {
      console.error('שגיאה בשמירת מודל:', error);
    }
  }

  /**
   * טעינת מודל
   */
  async loadModel(accountId) {
    try {
      const { data, error } = await supabase
        .from('ml_models')
        .select('model_data')
        .eq('ad_account_id', accountId)
        .eq('model_type', 'fraud_detection')
        .eq('status', 'active')
        .single();

      if (error) return null;
      return data?.model_data;
    } catch (error) {
      return null;
    }
  }

  /**
   * חישוב מדדי ביצועים
   */
  calculateMetrics(features, labels, model) {
    let tp = 0, fp = 0, tn = 0, fn = 0;

    features.forEach((feature, i) => {
      const featureValues = Object.values(feature);
      const prediction = this.sigmoid(this.dotProduct(model.weights, featureValues));
      const predicted = prediction > model.threshold ? 1 : 0;
      const actual = labels[i];

      if (predicted === 1 && actual === 1) tp++;
      else if (predicted === 1 && actual === 0) fp++;
      else if (predicted === 0 && actual === 0) tn++;
      else if (predicted === 0 && actual === 1) fn++;
    });

    const accuracy = ((tp + tn) / (tp + tn + fp + fn) * 100).toFixed(1);
    const precision = tp > 0 ? ((tp / (tp + fp)) * 100).toFixed(1) : 0;
    const recall = tp > 0 ? ((tp / (tp + fn)) * 100).toFixed(1) : 0;

    return {
      accuracy,
      precision,
      recall,
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn
    };
  }

  /**
   * עדכון אוטומטי של המודל
   */
  async autoUpdateModel(accountId) {
    try {
      console.log('🔄 מעדכן מודל אוטומטית...');

      // בדיקה אם יש מספיק נתונים חדשים
      const { data: recentClicks } = await supabase
        .from('raw_events')
        .select('id', { count: 'exact', head: true })
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if ((recentClicks?.count || 0) < 200) {
        console.log('לא מספיק נתונים חדשים');
        return null;
      }

      // אימון מחדש
      return await this.trainModel(accountId);
    } catch (error) {
      console.error('שגיאה בעדכון אוטומטי:', error);
      return null;
    }
  }
}

module.exports = new MLService();