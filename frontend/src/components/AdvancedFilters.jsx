/*
 * AdvancedFilters.jsx
 * 
 * מערכת סינון מתקדמת - MagenAd V2
 * 
 * תפקיד:
 * - סינון מתקדם של רשימות (אנומליות, התראות, clicks)
 * - חיפוש טקסטואלי (עם debounce)
 * - סינון לפי: חומרה, סטטוס, תאריכים, קמפיין, סכומים
 * - מיון: לפי תאריך/סכום, עולה/יורד
 * - ספירת פילטרים פעילים
 * - איפוס פילטרים
 * 
 * שימוש:
 * - מופיע ב-FraudAlertsPanel לסינון התראות
 * - מופיע בדפים עם רשימות ארוכות
 * - מאפשר למשתמש למצוא במהירות את מה שהוא מחפש
 * 
 * Props:
 * - onFilterChange: callback כאשר פילטר משתנה
 * - onReset: callback כאשר מאפסים פילטרים
 * 
 * State:
 * - isExpanded: האם הפאנל מורחב
 * - filters: אובייקט עם כל הפילטרים
 * - activeFiltersCount: מספר פילטרים פעילים
 * 
 * פילטרים:
 * - search: חיפוש טקסטואלי
 * - severity: חומרה (all/high/medium/low)
 * - status: סטטוס (all/active/resolved/dismissed)
 * - dateRange: טווח תאריכים (7days/30days/thisMonth/...)
 * - campaignId: קמפיין ספציפי
 * - minAmount/maxAmount: טווח סכומים
 * - sortBy: מיון לפי (date/amount)
 * - sortOrder: כיוון מיון (asc/desc)
 * 
 * תלויות:
 * - useDebounce (Hook לעיכוב חיפוש)
 * - lucide-react (אייקונים)
 */

import { useState } from 'react'
import { Filter, X, RefreshCw, Search } from 'lucide-react'
import { useDebounce } from '../Hooks/useDebounce'

export function AdvancedFilters({ onFilterChange, onReset }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    severity: 'all',
    status: 'all',
    dateRange: '7days',
    campaignId: 'all',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc'
  })

  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  
  // Debounce search
  const debouncedSearch = useDebounce(filters.search, 500)

  // Count active filters
  const countActiveFilters = (filterObj) => {
    let count = 0
    if (filterObj.search) count++
    if (filterObj.severity !== 'all') count++
    if (filterObj.status !== 'all') count++
    if (filterObj.dateRange !== '7days') count++
    if (filterObj.campaignId !== 'all') count++
    if (filterObj.minAmount) count++
    if (filterObj.maxAmount) count++
    return count
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setActiveFiltersCount(countActiveFilters(newFilters))
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters = {
      search: '',
      severity: 'all',
      status: 'all',
      dateRange: '7days',
      campaignId: 'all',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date',
      sortOrder: 'desc'
    }
    setFilters(resetFilters)
    setActiveFiltersCount(0)
    onReset()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          <Filter className="w-5 h-5" />
          פילטרים מתקדמים
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              אפס
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-0' : 'rotate-45'}`} />
          </button>
        </div>
      </div>

      {/* Filters Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              חיפוש
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="חפש לפי שם קמפיין, IP, מילות מפתח..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Row 1: Severity & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                חומרה
              </label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">הכל</option>
                <option value="high">גבוהה</option>
                <option value="medium">בינונית</option>
                <option value="low">נמוכה</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סטטוס
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">הכל</option>
                <option value="new">חדש</option>
                <option value="investigating">בבדיקה</option>
                <option value="resolved">פתור</option>
                <option value="dismissed">נדחה</option>
              </select>
            </div>
          </div>

          {/* Row 2: Date Range & Campaign */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                טווח תאריכים
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">היום</option>
                <option value="yesterday">אתמול</option>
                <option value="7days">7 ימים אחרונים</option>
                <option value="30days">30 ימים אחרונים</option>
                <option value="thisMonth">החודש הנוכחי</option>
                <option value="lastMonth">החודש שעבר</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קמפיין
              </label>
              <select
                value={filters.campaignId}
                onChange={(e) => handleFilterChange('campaignId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">כל הקמפיינים</option>
                {/* Dynamic campaigns will be loaded here */}
              </select>
            </div>
          </div>

          {/* Row 3: Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              טווח סכום (₪)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                placeholder="מינימום"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                placeholder="מקסימום"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Row 4: Sort */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מיין לפי
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">תאריך</option>
                <option value="severity">חומרה</option>
                <option value="amount">סכום</option>
                <option value="campaign">קמפיין</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סדר מיון
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">מהחדש לישן</option>
                <option value="asc">מהישן לחדש</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedFilters