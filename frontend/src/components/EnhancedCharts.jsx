/*
 * EnhancedCharts.jsx
 * 
 * קומפוננטות גרפים מקצועיים - MagenAd V2
 * 
 * תפקיד:
 * - גרפים מקצועיים עם Recharts
 * - תמיכה בסוגי גרפים: Line, Bar, Pie, Area
 * - עיצוב מותאם לעיצוב האפליקציה
 * - Responsive (מותאם לכל מסך)
 * 
 * קומפוננטות:
 * - LineChart: גרף קו (למגמות לאורך זמן)
 * - BarChart: גרף עמודות (להשוואות)
 * - PieChart: גרף עוגה (לחלוקה)
 * - AreaChart: גרף אזור (למגמות עם מילוי)
 * 
 * Props (כל גרף):
 * - data: מערך נתונים
 * - width, height: מידות (אופציונלי, ברירת מחדל: responsive)
 * - colors: מערך צבעים (אופציונלי)
 * 
 * שימוש:
 * - <LineChart data={chartData} />
 * - <BarChart data={chartData} colors={['#06b6d4', '#8b5cf6']} />
 * 
 * תלויות:
 * - recharts (ספריית גרפים)
 */

import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Cell 
  } from 'recharts'
  
  // ============================================
  // Clicks Over Time Chart
  // ============================================
  export function ClicksOverTimeChart({ data }) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          קליקים לאורך זמן
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="totalClicks" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="סה״כ קליקים"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="fraudClicks" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="הונאות"
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }
  
  // ============================================
  // Fraud Distribution Pie Chart
  // ============================================
  export function FraudDistributionChart({ data }) {
    const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6']
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          התפלגות סוגי הונאות
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => 
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }
  
  // ============================================
  // Daily Spend Bar Chart
  // ============================================
  export function DailySpendChart({ data }) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          הוצאה יומית וחיסכון
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="spend" 
              fill="#3b82f6" 
              name="הוצאה ($)"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="savedAmount" 
              fill="#10b981" 
              name="חיסכון ($)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }
  
  // ============================================
  // Conversion Rate Area Chart
  // ============================================
  export function ConversionRateChart({ data }) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          שיעור המרה
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="conversionRate" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorConversion)"
              name="שיעור המרה (%)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }
  
  // ============================================
  // Hourly Activity Heatmap
  // ============================================
  export function HourlyActivityChart({ data }) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          פעילות לפי שעות
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="hour" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="clicks" 
              fill="#3b82f6" 
              name="קליקים"
              radius={[0, 8, 8, 0]}
            />
            <Bar 
              dataKey="fraudClicks" 
              fill="#ef4444" 
              name="הונאות"
              radius={[0, 8, 8, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }
  