// src/store/useStore.js
// Zustand State Management - MagenAd V2

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================
// Auth Store
// ============================================
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: localStorage.getItem('token'),
      isAuthenticated: !!localStorage.getItem('token'),
      
      setUser: (user) => set({ user, isAuthenticated: true }),
      
      setToken: (token) => {
        localStorage.setItem('token', token)
        set({ token, isAuthenticated: true })
      },
      
      login: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },
      
      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// ============================================
// Campaign Store
// ============================================
export const useCampaignStore = create((set) => ({
  campaigns: [],
  selectedCampaign: null,
  loading: false,
  error: null,
  
  setCampaigns: (campaigns) => set({ campaigns, error: null }),
  setSelectedCampaign: (campaign) => set({ selectedCampaign: campaign }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  clearCampaigns: () => set({ campaigns: [], selectedCampaign: null })
}))

// ============================================
// Anomaly Store
// ============================================
export const useAnomalyStore = create((set) => ({
  anomalies: [],
  filters: {
    severity: 'all',
    status: 'all',
    timeRange: '7days',
    search: ''
  },
  stats: {
    total: 0,
    high: 0,
    medium: 0,
    low: 0
  },
  
  setAnomalies: (anomalies) => {
    const stats = {
      total: anomalies.length,
      high: anomalies.filter(a => a.severity === 'high').length,
      medium: anomalies.filter(a => a.severity === 'medium').length,
      low: anomalies.filter(a => a.severity === 'low').length
    }
    set({ anomalies, stats })
  },
  
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  
  clearFilters: () => set({
    filters: {
      severity: 'all',
      status: 'all',
      timeRange: '7days',
      search: ''
    }
  })
}))

// ============================================
// Dashboard Store
// ============================================
export const useDashboardStore = create((set) => ({
  stats: {
    totalClicks: 0,
    fraudClicks: 0,
    blockedIPs: 0,
    savedAmount: 0
  },
  chartData: [],
  recentAnomalies: [],
  loading: true,
  
  setStats: (stats) => set({ stats }),
  setChartData: (chartData) => set({ chartData }),
  setRecentAnomalies: (recentAnomalies) => set({ recentAnomalies }),
  setLoading: (loading) => set({ loading }),
  
  refreshDashboard: async () => {
    set({ loading: true })
    // API call logic here
    set({ loading: false })
  }
}))

// ============================================
// UI Store
// ============================================
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
  
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
  
  setTheme: (theme) => set({ theme }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      { id: Date.now(), ...notification }
    ]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  clearNotifications: () => set({ notifications: [] })
}))
