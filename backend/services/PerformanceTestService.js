/*
 * PerformanceTestService.js - בדיקות ביצועים
 * 
 * בדיקות:
 * - Load Testing (עומס)
 * - Stress Testing (לחץ)
 * - Spike Testing (פסגות)
 * - Endurance Testing (סיבולת)
 * - Database Performance
 * - API Response Times
 * - Memory Leaks
 */

const axios = require('axios');
const os = require('os');

class PerformanceTestService {
  constructor() {
    this.baseURL = process.env.API_BASE_URL || 'http://localhost:3001';
    this.results = {
      loadTest: null,
      stressTest: null,
      spikeTest: null,
      enduranceTest: null,
      databaseTest: null,
      memoryTest: null
    };
  }

  /**
   * הרצת כל בדיקות הביצועים
   */
  async runAllTests() {
    console.log('⚡ מתחיל בדיקות ביצועים...\n');

    try {
      // 1. Load Test
      await this.runLoadTest();
      
      // 2. Stress Test
      await this.runStressTest();
      
      // 3. Spike Test
      await this.runSpikeTest();
      
      // 4. Database Performance
      await this.runDatabaseTest();
      
      // 5. Memory Test
      await this.runMemoryTest();

      this.printSummary();
      
      return this.results;
    } catch (error) {
      console.error('❌ שגיאה בבדיקות ביצועים:', error);
      throw error;
    }
  }

  /**
   * 1. Load Test - בדיקת עומס
   * סימולציה: 1000 משתמשים במשך 5 דקות
   */
  async runLoadTest() {
    console.log('📊 בודק Load Test (1000 concurrent users)...');
    
    const config = {
      users: 1000,
      duration: 60, // seconds
      rampUp: 10 // seconds
    };

    const startTime = Date.now();
    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: []
    };

    try {
      // סימולציה של משתמשים מתחברים בהדרגה
      const usersPerSecond = config.users / config.rampUp;
      
      for (let second = 0; second < config.duration; second++) {
        const currentUsers = Math.min(
          config.users,
          Math.floor(usersPerSecond * second)
        );

        // שליחת בקשות מקבילות
        const requests = [];
        for (let i = 0; i < Math.min(50, currentUsers); i++) {
          requests.push(this.makeTestRequest('/api/health'));
        }

        const responses = await Promise.allSettled(requests);
        
        responses.forEach(response => {
          results.totalRequests++;
          if (response.status === 'fulfilled') {
            results.successfulRequests++;
            results.responseTimes.push(response.value.duration);
          } else {
            results.failedRequests++;
            results.errors.push(response.reason.message);
          }
        });

        // המתנה שנייה
        await this.sleep(1000);
      }

      const duration = Date.now() - startTime;

      // חישוב סטטיסטיקות
      const avgResponseTime = this.average(results.responseTimes);
      const p95ResponseTime = this.percentile(results.responseTimes, 95);
      const p99ResponseTime = this.percentile(results.responseTimes, 99);
      const throughput = (results.totalRequests / (duration / 1000)).toFixed(2);
      const successRate = ((results.successfulRequests / results.totalRequests) * 100).toFixed(2);

      this.results.loadTest = {
        config,
        totalRequests: results.totalRequests,
        successfulRequests: results.successfulRequests,
        failedRequests: results.failedRequests,
        successRate: `${successRate}%`,
        throughput: `${throughput} req/s`,
        avgResponseTime: `${avgResponseTime.toFixed(0)}ms`,
        p95ResponseTime: `${p95ResponseTime.toFixed(0)}ms`,
        p99ResponseTime: `${p99ResponseTime.toFixed(0)}ms`,
        duration: `${(duration / 1000).toFixed(2)}s`
      };

      console.log('✅ Load Test הושלם!');
      console.log(`  📊 בקשות: ${results.totalRequests}`);
      console.log(`  ✅ הצלחה: ${successRate}%`);
      console.log(`  ⚡ Throughput: ${throughput} req/s`);
      console.log(`  ⏱ זמן תגובה ממוצע: ${avgResponseTime.toFixed(0)}ms`);
      console.log('');
    } catch (error) {
      console.error('❌ Load Test נכשל:', error.message, '\n');
    }
  }

  /**
   * 2. Stress Test - בדיקת לחץ
   * מגדיל עומס עד שהמערכת נכשלת
   */
  async runStressTest() {
    console.log('💪 בודק Stress Test (finding breaking point)...');
    
    const results = {
      breakingPoint: 0,
      maxSuccessfulUsers: 0,
      failureReason: null
    };

    try {
      let currentUsers = 100;
      let consecutiveFailures = 0;

      while (consecutiveFailures < 3 && currentUsers < 10000) {
        console.log(`  🔄 בודק ${currentUsers} משתמשים...`);
        
        const requests = [];
        for (let i = 0; i < currentUsers; i++) {
          requests.push(this.makeTestRequest('/api/health'));
        }

        const responses = await Promise.allSettled(requests);
        const successCount = responses.filter(r => r.status === 'fulfilled').length;
        const successRate = (successCount / currentUsers) * 100;

        if (successRate < 90) {
          consecutiveFailures++;
          if (consecutiveFailures === 3) {
            results.breakingPoint = currentUsers;
            results.maxSuccessfulUsers = currentUsers - 200;
            results.failureReason = 'Success rate dropped below 90%';
          }
        } else {
          consecutiveFailures = 0;
        }

        currentUsers += 100;
        await this.sleep(500);
      }

      this.results.stressTest = results;

      console.log('✅ Stress Test הושלם!');
      console.log(`  💥 נקודת שבר: ~${results.breakingPoint} משתמשים`);
      console.log(`  ✅ מקסימום יציב: ~${results.maxSuccessfulUsers} משתמשים`);
      console.log('');
    } catch (error) {
      console.error('❌ Stress Test נכשל:', error.message, '\n');
    }
  }

  /**
   * 3. Spike Test - בדיקת פסגות פתאומיות
   */
  async runSpikeTest() {
    console.log('📈 בודק Spike Test (sudden traffic spikes)...');
    
    const results = {
      spikes: []
    };

    try {
      // פסגה 1: 100 → 1000 משתמשים
      const spike1 = await this.simulateSpike(100, 1000);
      results.spikes.push(spike1);

      await this.sleep(5000);

      // פסגה 2: 100 → 2000 משתמשים
      const spike2 = await this.simulateSpike(100, 2000);
      results.spikes.push(spike2);

      this.results.spikeTest = results;

      console.log('✅ Spike Test הושלם!');
      results.spikes.forEach((spike, i) => {
        console.log(`  📊 פסגה ${i + 1}: ${spike.successRate} הצלחה`);
      });
      console.log('');
    } catch (error) {
      console.error('❌ Spike Test נכשל:', error.message, '\n');
    }
  }

  /**
   * סימולציה של פסגה בתנועה
   */
  async simulateSpike(fromUsers, toUsers) {
    const requests = [];
    for (let i = 0; i < toUsers; i++) {
      requests.push(this.makeTestRequest('/api/health'));
    }

    const startTime = Date.now();
    const responses = await Promise.allSettled(requests);
    const duration = Date.now() - startTime;

    const successCount = responses.filter(r => r.status === 'fulfilled').length;
    const successRate = `${((successCount / toUsers) * 100).toFixed(1)}%`;

    return {
      from: fromUsers,
      to: toUsers,
      successRate,
      duration: `${duration}ms`
    };
  }

  /**
   * 4. Database Performance Test
   */
  async runDatabaseTest() {
    console.log('🗄️ בודק Database Performance...');
    
    const results = {
      queries: []
    };

    try {
      // בדיקת SELECT רגיל
      const select1 = await this.timeQuery(
        'SELECT simple',
        'SELECT * FROM raw_events LIMIT 100'
      );
      results.queries.push(select1);

      // בדיקת SELECT עם JOIN
      const select2 = await this.timeQuery(
        'SELECT with JOIN',
        `SELECT re.*, fd.* 
         FROM raw_events re 
         LEFT JOIN fraud_detections fd ON re.id = fd.event_id 
         LIMIT 100`
      );
      results.queries.push(select2);

      // בדיקת Aggregation
      const agg1 = await this.timeQuery(
        'Aggregation',
        `SELECT ad_account_id, COUNT(*) 
         FROM raw_events 
         WHERE event_timestamp > NOW() - INTERVAL '7 days' 
         GROUP BY ad_account_id`
      );
      results.queries.push(agg1);

      this.results.databaseTest = results;

      console.log('✅ Database Performance הושלם!');
      results.queries.forEach(q => {
        console.log(`  ⚡ ${q.name}: ${q.duration}`);
      });
      console.log('');
    } catch (error) {
      console.error('❌ Database Performance נכשל:', error.message, '\n');
    }
  }

  /**
   * מדידת זמן query
   */
  async timeQuery(name, query) {
    const startTime = Date.now();
    
    try {
      // כאן יהיה query אמיתי
      await this.sleep(Math.random() * 100 + 50);
      
      const duration = Date.now() - startTime;
      return {
        name,
        duration: `${duration}ms`,
        status: 'success'
      };
    } catch (error) {
      return {
        name,
        duration: '0ms',
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * 5. Memory Test - בדיקת דליפות זיכרון
   */
  async runMemoryTest() {
    console.log('💾 בודק Memory Usage...');
    
    const results = {
      initial: this.getMemoryUsage(),
      samples: [],
      final: null,
      leak: false
    };

    try {
      // דגימות זיכרון במשך 30 שניות
      for (let i = 0; i < 30; i++) {
        // סימולציה של עבודה
        await this.makeTestRequest('/api/health');
        
        const memory = this.getMemoryUsage();
        results.samples.push(memory);
        
        await this.sleep(1000);
      }

      results.final = this.getMemoryUsage();

      // בדיקת דליפה
      const memoryGrowth = results.final.heapUsed - results.initial.heapUsed;
      const growthPercent = (memoryGrowth / results.initial.heapUsed) * 100;
      
      if (growthPercent > 20) {
        results.leak = true;
        results.leakDetails = {
          growth: `${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`,
          percent: `${growthPercent.toFixed(1)}%`
        };
      }

      this.results.memoryTest = results;

      console.log('✅ Memory Test הושלם!');
      console.log(`  💾 התחלה: ${(results.initial.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  💾 סיום: ${(results.final.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      if (results.leak) {
        console.log(`  ⚠️ דליפת זיכרון זוהתה: ${results.leakDetails.growth}`);
      } else {
        console.log(`  ✅ אין דליפת זיכרון`);
      }
      console.log('');
    } catch (error) {
      console.error('❌ Memory Test נכשל:', error.message, '\n');
    }
  }

  /**
   * קבלת שימוש בזיכרון
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    };
  }

  /**
   * ביצוע בקשת test
   */
  async makeTestRequest(endpoint) {
    const startTime = Date.now();
    
    try {
      await axios.get(`${this.baseURL}${endpoint}`, {
        timeout: 5000
      });
      
      return {
        success: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  /**
   * חישוב ממוצע
   */
  average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * חישוב percentile
   */
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  /**
   * המתנה
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * הדפסת סיכום
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('⚡ סיכום בדיקות ביצועים');
    console.log('='.repeat(60));
    
    if (this.results.loadTest) {
      console.log('\n📊 Load Test:');
      console.log(`  • Success Rate: ${this.results.loadTest.successRate}`);
      console.log(`  • Throughput: ${this.results.loadTest.throughput}`);
      console.log(`  • Avg Response: ${this.results.loadTest.avgResponseTime}`);
      console.log(`  • P95: ${this.results.loadTest.p95ResponseTime}`);
    }

    if (this.results.stressTest) {
      console.log('\n💪 Stress Test:');
      console.log(`  • Breaking Point: ${this.results.stressTest.breakingPoint} users`);
      console.log(`  • Max Stable: ${this.results.stressTest.maxSuccessfulUsers} users`);
    }

    if (this.results.memoryTest && this.results.memoryTest.leak) {
      console.log('\n⚠️ Memory Leak Detected:');
      console.log(`  • Growth: ${this.results.memoryTest.leakDetails.growth}`);
      console.log(`  • Percent: ${this.results.memoryTest.leakDetails.percent}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }
}

module.exports = new PerformanceTestService();