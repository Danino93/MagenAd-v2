/*
 * Modal.jsx
 * 
 * קומפוננטת Modal כללית - MagenAd V2
 * 
 * תפקיד:
 * - Modal בסיסי לשימוש בכל האפליקציה
 * - תמיכה בגדלים שונים (sm/md/lg/xl)
 * - סגירה עם ESC או לחיצה מחוץ ל-Modal
 * - ConfirmModal - Modal לאישור פעולות מסוכנות
 * 
 * Props:
 * - isOpen: האם ה-Modal פתוח
 * - onClose: callback לסגירה
 * - title: כותרת ה-Modal
 * - children: תוכן ה-Modal
 * - size: גודל (sm/md/lg/xl)
 * 
 * ConfirmModal Props:
 * - isOpen, onClose, title, message, confirmText, cancelText
 * - onConfirm: callback לאישור
 * - variant: סוג (danger/warning/info)
 * 
 * שימוש:
 * - Modal כללי: <Modal isOpen={...} onClose={...}>...</Modal>
 * - Modal אישור: <ConfirmModal isOpen={...} onConfirm={...} />
 * 
 * תלויות:
 * - lucide-react (אייקונים)
 */
import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  footer 
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  }
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Confirmation Modal
export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'אישור פעולה',
  message,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  isDangerous = false
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              isDangerous 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  )
}

export default Modal
