/*
 * LoadingSpinner.jsx
 * 
 * קומפוננטת טעינה - MagenAd V2
 * 
 * תפקיד:
 * - הצגת אינדיקטור טעינה (spinner)
 * - תמיכה בגדלים שונים (sm/md/lg/xl)
 * - טקסט מותאם אישית
 * 
 * Props:
 * - size: גודל (sm/md/lg/xl) - ברירת מחדל: 'md'
 * - text: טקסט להצגה - ברירת מחדל: 'טוען...'
 * 
 * שימוש:
 * - <LoadingSpinner size="lg" text="טוען נתונים..." />
 * - <LoadingSpinner /> (גודל בינוני, טקסט ברירת מחדל)
 * 
 * עיצוב:
 * - Spinner עם אנימציה
 * - צבעים מותאמים לעיצוב האפליקציה
 */
export function LoadingSpinner({ size = 'md', text = 'טוען...' }) {
    const sizeClasses = {
      sm: 'w-4 h-4 border-2',
      md: 'w-8 h-8 border-4',
      lg: 'w-12 h-12 border-4',
      xl: 'w-16 h-16 border-4'
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
        {text && <p className="mt-4 text-gray-600">{text}</p>}
      </div>
    )
  }
  
  export function PageLoader() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="טוען נתונים..." />
      </div>
    )
  }
  
  export function InlineLoader({ text }) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner size="sm" text={text} />
      </div>
    )
  }
  
  export default LoadingSpinner
  