import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import LandingPageHebrew from './pages/LandingPage';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import ConnectAdsPage from './pages/ConnectAdsPage';
import CampaignsPage from './pages/CampaignsPage';

// Styles
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPageHebrew />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* App Routes */}
        <Route path="/app/dashboard" element={<Dashboard />} />
        <Route path="/app/connect-ads" element={<ConnectAdsPage />} />
        <Route path="/app/campaigns/:accountId" element={<CampaignsPage />} />
        
        {/* Placeholder Routes */}
        <Route path="/features" element={<Navigate to="/" />} />
        <Route path="/pricing" element={<Navigate to="/" />} />
        <Route path="/about" element={<Navigate to="/" />} />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
    <Toaster position="top-center" />
  </React.StrictMode>
);