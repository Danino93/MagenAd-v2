/*
 * EmptyState.jsx
 * 
 * קומפוננטת מצב ריק - MagenAd V2
 * 
 * תפקיד:
 * - הצגת הודעה כאשר אין נתונים להצגה
 * - תמיכה באייקונים שונים (AlertTriangle, FileX, Search, Inbox)
 * - אפשרות להוסיף כפתור פעולה
 * 
 * Props:
 * - icon: קומפוננטת אייקון (ברירת מחדל: FileX)
 * - title: כותרת - ברירת מחדל: 'אין נתונים'
 * - description: תיאור - ברירת מחדל: 'לא נמצאו פריטים להצגה'
 * - action: callback לכפתור פעולה (אופציונלי)
 * - actionText: טקסט כפתור פעולה (אופציונלי)
 * 
 * שימוש:
 * - <EmptyState title="אין התראות" description="הכל נקי!" />
 * - <EmptyState icon={Search} title="לא נמצאו תוצאות" action={handleSearch} actionText="חפש שוב" />
 * 
 * תלויות:
 * - lucide-react (אייקונים)
 */
import { AlertTriangle, FileX, Search, Inbox } from 'lucide-react'

export function EmptyState({ 
  icon: Icon = FileX, 
  title = 'אין נתונים',
  description = 'לא נמצאו פריטים להצגה',
  action,
  actionText
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="bg-gray-100 p-6 rounded-full mb-4">
        <Icon className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionText || 'נסה שוב'}
        </button>
      )}
    </div>
  )
}

export function NoResultsFound({ onReset }) {
  return (
    <EmptyState
      icon={Search}
      title="לא נמצאו תוצאות"
      description="נסה לשנות את הפילטרים או תנאי החיפוש"
      action={onReset}
      actionText="אפס פילטרים"
    />
  )
}

export function NoAnomalies() {
  return (
    <EmptyState
      icon={Inbox}
      title="אין אנומליות"
      description="לא זוהו אנומליות בתקופה זו - זה סימן טוב!"
    />
  )
}

export default EmptyState
