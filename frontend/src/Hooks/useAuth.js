// src/hooks/useAuth.js
import { useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/useStore'
import { notify } from '../utils/notifications'

const API_URL = 'http://localhost:3001/api'

export function useAuth() {
  const { user, isAuthenticated, login, logout } = useAuthStore()
  const [loading, setLoading] = useState(false)
  
  const handleLogin = async (email, password) => {
    try {
      setLoading(true)
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })
      
      const { token, user } = response.data
      login(user, token)
      
      notify.success('התחברת בהצלחה!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'שגיאה בהתחברות'
      notify.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogout = () => {
    logout()
    notify.success('התנתקת בהצלחה')
  }
  
  return {
    user,
    isAuthenticated,
    loading,
    login: handleLogin,
    logout: handleLogout
  }
}

export default useAuth
