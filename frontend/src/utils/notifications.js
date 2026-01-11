// src/utils/notifications.js
// Toast Notifications System - MagenAd V2

import toast from 'react-hot-toast'

export const notify = {
  // Success notification
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      position: 'top-center',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
      ...options
    })
  },
  
  // Error notification
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      position: 'top-center',
      style: {
        background: '#ef4444',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
      ...options
    })
  },
  
  // Loading notification
  loading: (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-center',
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
      ...options
    })
  },
  
  // Warning notification
  warning: (message, options = {}) => {
    return toast(message, {
      duration: 4500,
      position: 'top-center',
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
      ...options
    })
  },
  
  // Info notification
  info: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      position: 'top-center',
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        fontSize: '14px',
      },
      ...options
    })
  },
  
  // Custom notification
  custom: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      position: 'top-center',
      ...options
    })
  },
  
  // Promise notification (for async operations)
  promise: (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'טוען...',
        success: messages.success || 'הפעולה הושלמה בהצלחה',
        error: messages.error || 'שגיאה בביצוע הפעולה',
      },
      {
        position: 'top-center',
        style: {
          padding: '16px',
          borderRadius: '8px',
          fontSize: '14px',
        }
      }
    )
  },
  
  // Dismiss notification
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  },
  
  // Dismiss all notifications
  dismissAll: () => {
    toast.dismiss()
  }
}

// Notification helper for API calls
export const apiNotify = {
  // For successful API calls
  success: (action = 'הפעולה') => {
    notify.success(`${action} בוצעה בהצלחה`)
  },
  
  // For failed API calls
  error: (error, action = 'הפעולה') => {
    const message = error.response?.data?.message || `שגיאה ב${action}`
    notify.error(message)
  },
  
  // For async API calls
  async: (promise, actions = {}) => {
    return notify.promise(promise, {
      loading: actions.loading || 'מעבד...',
      success: actions.success || 'הפעולה הושלמה',
      error: actions.error || 'שגיאה בפעולה'
    })
  }
}

// Examples of usage:
/*
// Simple success
notify.success('הקובץ נשמר בהצלחה')

// Simple error
notify.error('שגיאה בטעינת הנתונים')

// Loading with dismiss
const loadingToast = notify.loading('טוען נתונים...')
// ... after loading
notify.dismiss(loadingToast)
notify.success('הנתונים נטענו')

// Promise notification
notify.promise(
  fetchData(),
  {
    loading: 'טוען נתונים...',
    success: 'הנתונים נטענו בהצלחה',
    error: 'שגיאה בטעינת נתונים'
  }
)

// API notification
try {
  const result = await api.post('/endpoint', data)
  apiNotify.success('השמירה')
} catch (error) {
  apiNotify.error(error, 'השמירה')
}

// Or use async helper
await apiNotify.async(
  api.post('/endpoint', data),
  {
    loading: 'שומר...',
    success: 'נשמר בהצלחה',
    error: 'שגיאה בשמירה'
  }
)
*/
