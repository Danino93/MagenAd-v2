/*
 * Dashboard Load Test
 * -------------------
 * בדיקת עומס ל-Dashboard API
 * 
 * הרצה: k6 run backend/tests/load/dashboard.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 50 },   // Scale down
    { duration: '30s', target: 0 }    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01']    // Error rate should be below 1%
  }
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001'
const TOKEN = __ENV.TOKEN || 'YOUR_TEST_TOKEN'

export default function() {
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
  
  // Test dashboard stats
  let response = http.get(`${BASE_URL}/api/dashboard/stats`, { headers })
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has data': (r) => {
      try {
        const json = JSON.parse(r.body)
        return json.hasOwnProperty('total_campaigns') || json.hasOwnProperty('total_anomalies')
      } catch {
        return false
      }
    }
  })
  
  sleep(1)
  
  // Test anomalies list
  response = http.get(`${BASE_URL}/api/anomalies`, { headers })
  
  check(response, {
    'anomalies loaded': (r) => r.status === 200
  })
  
  sleep(1)
}
