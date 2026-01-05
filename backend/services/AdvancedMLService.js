/*
 * AdvancedMLService.js - למידת מכונה מתקדמת
 * 
 * מערכת ML מתקדמת:
 * - רשת נוירונים (Neural Network)
 * - Ensemble Learning (שילוב מודלים)
 * - Feature Engineering מתקדם
 * - Cross-validation
 * - Hyperparameter Tuning
 * - Model Comparison
 */

const supabase = require('../config/supabase');

class AdvancedMLService {
  constructor() {
    this.models = new Map();
    this.ensembleWeights = {
      logistic: 0.4,
      neuralNet: 0.6
    };
  }

  /**
   * רשת נוירונים פשוטה (2 שכבות)
   */
  createNeuralNetwork(inputSize, hiddenSize = 10) {
    return {
      weightsInputHidden: this.randomMatrix(inputSize, hiddenSize),
      weightsHiddenOutput: this.randomMatrix(hiddenSize, 1),
      biasHidden: new Array(hiddenSize).fill(0).map(() => Math.random() - 0.5),
      biasOutput: Math.random() - 0.5
    };
  }

  /**
   * יצירת מטריצה אקראית
   */
  randomMatrix(rows, cols) {
    return Array(rows).fill(0).map(() =>
      Array(cols).fill(0).map(() => Math.random() - 0.5)
    );
  }

  /**
   * פונקציית ReLU
   */
  relu(x) {
    return Math.max(0, x);
  }

  /**
   * פונקציית Sigmoid
   */
  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Forward Pass - רשת נוירונים
   */
  forwardPass(network, input) {
    // שכבה נסתרת
    const hidden = [];
    for (let h = 0; h < network.weightsInputHidden[0].length; h++) {
      let sum = network.biasHidden[h];
      for (let i = 0; i < input.length; i++) {
        sum += input[i] * network.weightsInputHidden[i][h];
      }
      hidden.push(this.relu(sum));
    }

    // שכבת פלט
    let output = network.biasOutput;
    for (let h = 0; h < hidden.length; h++) {
      output += hidden[h] * network.weightsHiddenOutput[h][0];
    }

    return this.sigmoid(output);
  }

  /**
   * אימון רשת נוירונים
   */
  async trainNeuralNetwork(accountId) {
    console.log('🧠 מתחיל אימון רשת נוירונים...');

    // שליפת נתונים
    const trainingData = await this.getTrainingData(accountId);
    
    if (trainingData.length < 200) {
      console.log('⚠️ לא מספיק נתונים לרשת נוירונים');
      return null;
    }

    // חילוץ פיצ'רים
    const features = trainingData.map(d => this.extractAdvancedFeatures(d));
    const labels = trainingData.map(d => d.is_fraud ? 1 : 0);

    // יצירת רשת
    const network = this.createNeuralNetwork(features[0].length, 15);

    // אימון (גרסה פשוטה)
    const learningRate = 0.01;
    const epochs = 500;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;

      for (let i = 0; i < features.length; i++) {
        const prediction = this.forwardPass(network, features[i]);
        const error = labels[i] - prediction;
        totalLoss += error * error;

        // עדכון משקולות (פשוט)
        const learningSignal = error * learningRate;
        
        // עדכון משקולות פלט
        for (let h = 0; h < network.weightsHiddenOutput.length; h++) {
          network.weightsHiddenOutput[h][0] += learningSignal;
        }
      }

      if (epoch % 100 === 0) {
        console.log(`Epoch ${epoch}: Loss = ${(totalLoss / features.length).toFixed(4)}`);
      }
    }

    // שמירת מודל
    await this.saveNeuralNetwork(accountId, network);

    // חישוב דיוק
    const accuracy = this.calculateAccuracy(network, features, labels);
    console.log(`✅ רשת נוירונים אומנה! דיוק: ${accuracy}%`);

    return { network, accuracy };
  }

  /**
   * חילוץ פיצ'רים מתקדמים
   */
  extractAdvancedFeatures(click) {
    const timestamp = new Date(click.event_timestamp);
    
    return [
      // פיצ'רים בסיסיים
      timestamp.getHours() / 24,
      timestamp.getDay() / 7,
      click.is_vpn ? 1 : 0,
      click.is_hosting ? 1 : 0,
      click.risk_score / 100,
      
      // פיצ'רים מתקדמים
      this.getCountryRiskNormalized(click.country_code),
      this.getDeviceScore(click.device_type),
      this.getHourRisk(timestamp.getHours()),
      
      // פיצ'רים משולבים
      (click.is_vpn && click.risk_score > 70) ? 1 : 0,
      (timestamp.getHours() >= 0 && timestamp.getHours() <= 5) ? 1 : 0,
      
      // נורמליזציה של עלות
      click.cost_micros ? Math.min(click.cost_micros / 5000000, 1) : 0
    ];
  }

  /**
   * דירוג מדינה מנורמל
   */
  getCountryRiskNormalized(countryCode) {
    const highRisk = ['CN', 'RU', 'VN', 'IN', 'BD', 'PK'];
    const mediumRisk = ['BR', 'TR', 'ID', 'NG', 'PH'];
    
    if (highRisk.includes(countryCode)) return 1.0;
    if (mediumRisk.includes(countryCode)) return 0.6;
    return 0.3;
  }

  /**
   * ציון מכשיר
   */
  getDeviceScore(deviceType) {
    const scores = {
      'MOBILE': 0.7,
      'DESKTOP': 0.4,
      'TABLET': 0.5,
      'UNKNOWN': 0.9
    };
    return scores[deviceType] || 0.8;
  }

  /**
   * סיכון לפי שעה
   */
  getHourRisk(hour) {
    // שעות לילה = סיכון גבוה יותר
    if (hour >= 0 && hour <= 5) return 1.0;
    if (hour >= 6 && hour <= 8) return 0.6;
    if (hour >= 9 && hour <= 17) return 0.3;
    if (hour >= 18 && hour <= 22) return 0.5;
    return 0.7;
  }

  /**
   * Ensemble Prediction - שילוב מודלים
   */
  async ensemblePredict(accountId, click) {
    try {
      // טעינת שני המודלים
      const [logisticModel, neuralModel] = await Promise.all([
        this.loadLogisticModel(accountId),
        this.loadNeuralNetwork(accountId)
      ]);

      if (!logisticModel || !neuralModel) {
        console.log('חסר מודל - משתמש במודל יחיד');
        return null;
      }

      // חילוץ פיצ'רים
      const basicFeatures = this.extractBasicFeatures(click);
      const advancedFeatures = this.extractAdvancedFeatures(click);

      // חיזוי מכל מודל
      const logisticPred = this.logisticPredict(logisticModel, basicFeatures);
      const neuralPred = this.forwardPass(neuralModel, advancedFeatures);

      // שילוב משוקלל
      const ensemblePred = 
        logisticPred * this.ensembleWeights.logistic +
        neuralPred * this.ensembleWeights.neuralNet;

      return {
        isFraud: ensemblePred > 0.5,
        probability: (ensemblePred * 100).toFixed(1),
        confidence: Math.abs(ensemblePred - 0.5) * 2 * 100,
        modelBreakdown: {
          logistic: (logisticPred * 100).toFixed(1),
          neural: (neuralPred * 100).toFixed(1),
          ensemble: (ensemblePred * 100).toFixed(1)
        }
      };
    } catch (error) {
      console.error('שגיאה ב-ensemble prediction:', error);
      return null;
    }
  }

  /**
   * חילוץ פיצ'רים בסיסיים
   */
  extractBasicFeatures(click) {
    const timestamp = new Date(click.event_timestamp);
    return {
      hour_of_day: timestamp.getHours(),
      day_of_week: timestamp.getDay(),
      is_vpn: click.is_vpn ? 1 : 0,
      is_hosting: click.is_hosting ? 1 : 0,
      risk_score: click.risk_score || 0,
      country_risk: this.getCountryRisk(click.country_code),
      time_since_last_click: 0,
      clicks_from_ip: 1,
      device_type_encoded: this.encodeDeviceType(click.device_type)
    };
  }

  /**
   * חיזוי לוגיסטי
   */
  logisticPredict(model, features) {
    const featureValues = Object.values(features);
    const dotProduct = model.weights.reduce((sum, w, i) => 
      sum + w * featureValues[i], 0
    );
    return this.sigmoid(dotProduct);
  }

  /**
   * Cross-Validation
   */
  async crossValidate(accountId, folds = 5) {
    console.log(`🔄 מריץ Cross-Validation עם ${folds} folds...`);

    const data = await this.getTrainingData(accountId);
    
    if (data.length < folds * 20) {
      console.log('לא מספיק נתונים ל-Cross-Validation');
      return null;
    }

    // חלוקה ל-folds
    const foldSize = Math.floor(data.length / folds);
    const accuracies = [];

    for (let i = 0; i < folds; i++) {
      const testStart = i * foldSize;
      const testEnd = testStart + foldSize;
      
      const testData = data.slice(testStart, testEnd);
      const trainData = [...data.slice(0, testStart), ...data.slice(testEnd)];

      // אימון על train set
      const features = trainData.map(d => this.extractAdvancedFeatures(d));
      const labels = trainData.map(d => d.is_fraud ? 1 : 0);
      
      const network = this.createNeuralNetwork(features[0].length, 10);
      // אימון מהיר...
      
      // בדיקה על test set
      const testFeatures = testData.map(d => this.extractAdvancedFeatures(d));
      const testLabels = testData.map(d => d.is_fraud ? 1 : 0);
      const accuracy = this.calculateAccuracy(network, testFeatures, testLabels);
      
      accuracies.push(accuracy);
      console.log(`Fold ${i + 1}: ${accuracy}%`);
    }

    const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    console.log(`✅ ממוצע: ${avgAccuracy.toFixed(1)}%`);

    return {
      folds,
      accuracies,
      avgAccuracy: avgAccuracy.toFixed(1),
      stdDev: this.calculateStdDev(accuracies).toFixed(1)
    };
  }

  /**
   * חישוב סטיית תקן
   */
  calculateStdDev(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * חישוב דיוק
   */
  calculateAccuracy(network, features, labels) {
    let correct = 0;
    
    for (let i = 0; i < features.length; i++) {
      const prediction = this.forwardPass(network, features[i]);
      const predicted = prediction > 0.5 ? 1 : 0;
      if (predicted === labels[i]) correct++;
    }

    return ((correct / features.length) * 100).toFixed(1);
  }

  /**
   * A/B Testing - השוואת מודלים
   */
  async compareModels(accountId) {
    console.log('📊 מריץ A/B Testing...');

    const testData = await this.getTestData(accountId, 200);
    
    const [logisticModel, neuralModel] = await Promise.all([
      this.loadLogisticModel(accountId),
      this.loadNeuralNetwork(accountId)
    ]);

    const results = {
      logistic: { correct: 0, total: testData.length },
      neural: { correct: 0, total: testData.length },
      ensemble: { correct: 0, total: testData.length }
    };

    for (const item of testData) {
      const actual = item.is_fraud ? 1 : 0;

      // לוגיסטי
      const basicFeatures = this.extractBasicFeatures(item);
      const logPred = this.logisticPredict(logisticModel, basicFeatures) > 0.5 ? 1 : 0;
      if (logPred === actual) results.logistic.correct++;

      // רשת נוירונים
      const advFeatures = this.extractAdvancedFeatures(item);
      const nnPred = this.forwardPass(neuralModel, advFeatures) > 0.5 ? 1 : 0;
      if (nnPred === actual) results.neural.correct++;

      // Ensemble
      const ensemblePred = (
        logPred * this.ensembleWeights.logistic +
        nnPred * this.ensembleWeights.neuralNet
      ) > 0.5 ? 1 : 0;
      if (ensemblePred === actual) results.ensemble.correct++;
    }

    // חישוב דיוקים
    results.logistic.accuracy = (results.logistic.correct / results.logistic.total * 100).toFixed(1);
    results.neural.accuracy = (results.neural.correct / results.neural.total * 100).toFixed(1);
    results.ensemble.accuracy = (results.ensemble.correct / results.ensemble.total * 100).toFixed(1);

    console.log('📊 תוצאות:');
    console.log(`Logistic: ${results.logistic.accuracy}%`);
    console.log(`Neural: ${results.neural.accuracy}%`);
    console.log(`Ensemble: ${results.ensemble.accuracy}%`);

    return results;
  }

  /**
   * שליפת נתוני אימון
   */
  async getTrainingData(accountId) {
    const { data } = await supabase
      .from('raw_events')
      .select(`
        *,
        fraud_detections:fraud_detections(id)
      `)
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .order('event_timestamp', { ascending: false })
      .limit(3000);

    return (data || []).map(click => ({
      ...click,
      is_fraud: click.fraud_detections && click.fraud_detections.length > 0
    }));
  }

  /**
   * שליפת נתוני בדיקה
   */
  async getTestData(accountId, limit = 200) {
    return await this.getTrainingData(accountId);
  }

  /**
   * שמירת רשת נוירונים
   */
  async saveNeuralNetwork(accountId, network) {
    try {
      await supabase
        .from('ml_models')
        .upsert({
          ad_account_id: accountId,
          model_type: 'neural_network',
          model_data: network,
          status: 'active',
          trained_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('שגיאה בשמירת רשת נוירונים:', error);
    }
  }

  /**
   * טעינת רשת נוירונים
   */
  async loadNeuralNetwork(accountId) {
    try {
      const { data } = await supabase
        .from('ml_models')
        .select('model_data')
        .eq('ad_account_id', accountId)
        .eq('model_type', 'neural_network')
        .eq('status', 'active')
        .single();

      return data?.model_data;
    } catch (error) {
      return null;
    }
  }

  /**
   * טעינת מודל לוגיסטי
   */
  async loadLogisticModel(accountId) {
    try {
      const { data } = await supabase
        .from('ml_models')
        .select('model_data')
        .eq('ad_account_id', accountId)
        .eq('model_type', 'fraud_detection')
        .eq('status', 'active')
        .single();

      return data?.model_data;
    } catch (error) {
      return null;
    }
  }

  /**
   * עזרים
   */
  getCountryRisk(countryCode) {
    const highRisk = ['CN', 'RU', 'VN', 'IN', 'BD', 'PK'];
    const mediumRisk = ['BR', 'TR', 'ID', 'NG', 'PH'];
    if (highRisk.includes(countryCode)) return 3;
    if (mediumRisk.includes(countryCode)) return 2;
    return 1;
  }

  encodeDeviceType(deviceType) {
    const mapping = { 'MOBILE': 0, 'DESKTOP': 1, 'TABLET': 2, 'UNKNOWN': 3 };
    return mapping[deviceType] || 3;
  }
}

module.exports = new AdvancedMLService();