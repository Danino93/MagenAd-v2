/*
 * ReportsGenerator.jsx
 * 
 * קומפוננטה ליצירת דוחות מתקדמים - MagenAd V2
 * 
 * תפקיד:
 * - יצירת דוחות בפורמטים שונים (PDF, Excel, CSV)
 * - 4 סוגי דוחות: סיכום כללי, אנומליות, פיננסי, קמפיינים
 * - בחירת טווח תאריכים (היום, אתמול, 7/30 ימים, חודש נוכחי/קודם)
 * - אפשרות לכלול/לא לכלול: גרפים, אנומליות, קמפיינים, נתונים פיננסיים
 * 
 * שימוש:
 * - מופיע ב-Dashboard ככפתור/אייקון ליצירת דוחות
 * - פותח Modal עם אפשרויות בחירה
 * - שולח בקשה ל-Backend: POST /api/reports/generate
 * - מוריד את הקובץ שנוצר (PDF/Excel/CSV)
 * 
 * Props:
 * - אין (קומפוננטה עצמאית)
 * 
 * State:
 * - isOpen: האם ה-Modal פתוח
 * - loading: האם בתהליך יצירה
 * - reportConfig: הגדרות הדוח (סוג, תאריכים, פורמט, אפשרויות)
 * 
 * API:
 * - POST /api/reports/generate
 *   Body: { type, dateRange, format, includeCharts, includeAnomalies, includeCampaigns, includeFinancials, accountId }
 * 
 * תלויות:
 * - react-hot-toast (notifications)
 * - axios (API calls)
 * - Modal, LoadingSpinner (קומפוננטות עזר)
 */

import { useState } from 'react'
import { 
  Download, 
  FileText, 
  Calendar, 
  Filter,
  TrendingUp,
  AlertTriangle,
  DollarSign
} from 'lucide-react'
import { notify } from '../utils/notifications'
import { reportsAPI } from '../services/api'
import { Modal } from './Modal'
import { LoadingSpinner } from './LoadingSpinner'

export function ReportsGenerator() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reportConfig, setReportConfig] = useState({
    type: 'summary',
    dateRange: '7days',
    format: 'pdf',
    includeCharts: true,
    includeAnomalies: true,
    includeCampaigns: true,
    includeFinancials: true
  })

  const reportTypes = [
    { 
      value: 'summary', 
      label: 'סיכום כללי',
      icon: FileText,
      description: 'סקירה כוללת של כל הפעילות'
    },
    { 
      value: 'anomalies', 
      label: 'דוח אנומליות',
      icon: AlertTriangle,
      description: 'ריכוז כל האנומליות שזוהו'
    },
    { 
      value: 'financial', 
      label: 'דוח פיננסי',
      icon: DollarSign,
      description: 'הוצאות, חיסכון ו-ROI'
    },
    { 
      value: 'campaigns', 
      label: 'דוח קמפיינים',
      icon: TrendingUp,
      description: 'ביצועים של כל הקמפיינים'
    }
  ]

  const dateRanges = [
    { value: 'today', label: 'היום' },
    { value: 'yesterday', label: 'אתמול' },
    { value: '7days', label: '7 ימים אחרונים' },
    { value: '30days', label: '30 ימים אחרונים' },
    { value: 'thisMonth', label: 'החודש הנוכחי' },
    { value: 'lastMonth', label: 'החודש שעבר' },
    { value: 'custom', label: 'תאריכים מותאמים' }
  ]

  const formats = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'excel', label: 'Excel', icon: '📊' },
    { value: 'csv', label: 'CSV', icon: '📋' }
  ]

  const handleGenerateReport = async () => {
    try {
      setLoading(true)
      
      // Use API service
      const blob = await reportsAPI.generate(reportConfig)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const extension = reportConfig.format === 'excel' ? 'xlsx' : reportConfig.format
      link.setAttribute('download', `magenad-report-${Date.now()}.${extension}`)
      
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      notify.success('הדוח הופק בהצלחה!')
      setIsOpen(false)
    } catch (error) {
      // Error already handled by interceptor
      console.error('Report generation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Download className="w-5 h-5" />
        הפק דוח
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="הפקת דוח מתקדם"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              ביטול
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" text="" />
                  מפיק דוח...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  הפק דוח
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              סוג הדוח
            </label>
            <div className="grid grid-cols-2 gap-3">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setReportConfig({ ...reportConfig, type: type.value })}
                  className={`p-4 border-2 rounded-lg text-right transition-all ${
                    reportConfig.type === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <type.icon className={`w-5 h-5 ${
                      reportConfig.type === type.value ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline ml-2" />
              טווח תאריכים
            </label>
            <select
              value={reportConfig.dateRange}
              onChange={(e) => setReportConfig({ ...reportConfig, dateRange: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {dateRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              פורמט הדוח
            </label>
            <div className="grid grid-cols-3 gap-3">
              {formats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setReportConfig({ ...reportConfig, format: format.value })}
                  className={`p-3 border-2 rounded-lg transition-all ${
                    reportConfig.format === format.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{format.icon}</div>
                  <div className="text-sm font-medium">{format.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Filter className="w-4 h-4 inline ml-2" />
              מה לכלול בדוח
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.includeCharts}
                  onChange={(e) => setReportConfig({ 
                    ...reportConfig, 
                    includeCharts: e.target.checked 
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">גרפים ותרשימים</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.includeAnomalies}
                  onChange={(e) => setReportConfig({ 
                    ...reportConfig, 
                    includeAnomalies: e.target.checked 
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">אנומליות שזוהו</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.includeCampaigns}
                  onChange={(e) => setReportConfig({ 
                    ...reportConfig, 
                    includeCampaigns: e.target.checked 
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">נתוני קמפיינים</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.includeFinancials}
                  onChange={(e) => setReportConfig({ 
                    ...reportConfig, 
                    includeFinancials: e.target.checked 
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">נתונים פיננסיים</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ReportsGenerator