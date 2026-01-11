/*
 * Mobile Menu (Hamburger)
 * ------------------------
 * תפריט נייד רספונסיבי
 */

import { useState } from 'react'
import { Menu, X, Home, AlertTriangle, FileText, Settings, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useStore'

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/app/dashboard' },
    { icon: AlertTriangle, label: 'אנומליות', path: '/app/anomalies' },
    { icon: FileText, label: 'דוחות', path: '/app/reports' },
    { icon: Settings, label: 'הגדרות', path: '/app/settings' }
  ]
  
  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsOpen(false)
  }
  
  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="תפריט"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
      
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 md:hidden animate-slideInRight">
            <div className="p-6">
              {/* Logo */}
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="font-bold text-xl">MagenAd</span>
              </div>
              
              {/* Menu Items */}
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-8 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">התנתק</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
