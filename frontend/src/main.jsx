import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationsProvider } from './contexts/NotificationsContext';

// Pages
import LandingPageHebrew from './pages/LandingPage';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import ConnectAdsPage from './pages/ConnectAdsPage';
import CampaignsPage from './pages/CampaignsPage';
import OnboardingPage from './pages/OnboardingPage';

// Styles
import './index.css'
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <NotificationsProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPageHebrew />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* App Routes */}
            <Route path="/app/dashboard" element={<Dashboard />} />
            <Route path="/app/onboarding" element={<OnboardingPage />} />
            <Route path="/app/connect-ads" element={<ConnectAdsPage />} />
            <Route path="/app/campaigns/:accountId" element={<CampaignsPage />} />
            
            {/* Placeholder Routes */}
            <Route path="/features" element={<Navigate to="/" />} />
            <Route path="/pricing" element={<Navigate to="/" />} />
            <Route path="/about" element={<Navigate to="/" />} />
            
            {/* 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </NotificationsProvider>
      </BrowserRouter>
      <Toaster position="top-center" />
    </ErrorBoundary>
  </React.StrictMode>
);