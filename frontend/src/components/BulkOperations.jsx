/*
 * BulkOperations.jsx
 * 
 * קומפוננטה לפעולות מרוכזות על פריטים מרובים - MagenAd V2
 * 
 * תפקיד:
 * - בחירת פריטים מרובים (checkbox)
 * - פעולות מרוכזות: פתרון, ביטול, מחיקה, שליחה לחקירה
 * - תמיכה בסוגים שונים: anomalies, alerts, clicks
 * - Modal לאישור פעולות מסוכנות (מחיקה)
 * 
 * שימוש:
 * - מופיע ב-FraudAlertsPanel לניהול התראות
 * - מופיע בדפים עם רשימות (אנומליות, התראות, וכו')
 * - מאפשר פעולות מהירות על מספר פריטים בו-זמנית
 * 
 * Props:
 * - items: מערך הפריטים (anomalies/alerts/clicks)
 * - selectedItems: מערך IDs של פריטים שנבחרו
 * - onSelectionChange: callback לעדכון בחירה
 * - onActionComplete: callback לאחר השלמת פעולה
 * - type: סוג הפריטים ('anomalies' | 'alerts' | 'clicks')
 * 
 * State:
 * - showConfirm: האם להציג Modal אישור
 * - pendingAction: הפעולה הממתינה לאישור
 * - loading: האם בתהליך ביצוע
 * 
 * API:
 * - POST /api/anomalies/bulk-resolve
 * - POST /api/anomalies/bulk-dismiss
 * - POST /api/anomalies/bulk-delete
 * - POST /api/anomalies/bulk-investigate
 * 
 * תלויות:
 * - react-hot-toast (notifications)
 * - axios (API calls)
 * - Modal (ConfirmModal)
 * - lucide-react (אייקונים)
 */

import { useState } from 'react'
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Archive, 
  CheckCircle, 
  XCircle,
  AlertTriangle 
} from 'lucide-react'
import { notify } from '../utils/notifications'
import { ConfirmModal } from './Modal'
import { anomaliesAPI } from '../services/api'

export function BulkOperations({ items, selectedItems, onSelectionChange, onActionComplete, type = 'anomalies' }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [loading, setLoading] = useState(false)

  const isAllSelected = items.length > 0 && selectedItems.length === items.length
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < items.length

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(items.map(item => item.id))
    }
  }

  const handleAction = (action) => {
    if (selectedItems.length === 0) {
      notify.warning('נא לבחור לפחות פריט אחד')
      return
    }
    setPendingAction(action)
    setShowConfirm(true)
  }

  const executeAction = async () => {
    try {
      setLoading(true)
      
      let result
      switch (pendingAction) {
        case 'resolve':
          result = await anomaliesAPI.bulkResolve(selectedItems)
          break
        case 'dismiss':
          result = await anomaliesAPI.bulkDismiss(selectedItems)
          break
        case 'delete':
          result = await anomaliesAPI.bulkDelete(selectedItems)
          break
        case 'investigate':
          result = await anomaliesAPI.bulkInvestigate(selectedItems)
          break
        default:
          throw new Error('פעולה לא ידועה')
      }
      
      notify.success(result.message || 'הפעולה בוצעה בהצלחה')
      onSelectionChange([])
      onActionComplete()
    } catch (error) {
      // Error already handled by interceptor
      console.error('Bulk operation failed:', error)
    } finally {
      setLoading(false)
      setShowConfirm(false)
      setPendingAction(null)
    }
  }

  const getActionMessage = () => {
    switch (pendingAction) {
      case 'resolve':
        return `האם לסמן ${selectedItems.length} פריטים כפתורים?`
      case 'dismiss':
        return `האם לדחות ${selectedItems.length} פריטים?`
      case 'delete':
        return `האם למחוק ${selectedItems.length} פריטים? לא ניתן לבטל פעולה זו.`
      case 'investigate':
        return `האם לשלוח ${selectedItems.length} פריטים לבדיקה מעמיקה?`
      default:
        return ''
    }
  }

  if (items.length === 0) return null

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Selection Control */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : isSomeSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-400" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {selectedItems.length > 0 
                  ? `${selectedItems.length} נבחרו` 
                  : 'בחר הכל'
                }
              </span>
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction('investigate')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                שלח לבדיקה
              </button>

              <button
                onClick={() => handleAction('resolve')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                סמן כפתור
              </button>

              <button
                onClick={() => handleAction('dismiss')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                דחה
              </button>

              <button
                onClick={() => handleAction('delete')}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                מחק
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeAction}
        title="אישור פעולה"
        message={getActionMessage()}
        isDangerous={pendingAction === 'delete'}
        confirmText={loading ? 'מבצע...' : 'אישור'}
      />
    </>
  )
}

export default BulkOperations