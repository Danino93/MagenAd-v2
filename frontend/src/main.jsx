import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationsProvider } from './contexts/NotificationsContext';

// Layouts
import MarketingLayout from './layouts/MarketingLayout';

// Pages
import LandingPageHebrew from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import FAQPage from './pages/FAQPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';
import ContactPage from './pages/ContactPage';
import BlogPage from './pages/BlogPage';
import CompetitorLP from './pages/lp/CompetitorLP';
import AgencyLP from './pages/lp/AgencyLP';
import SecurityScanner from './pages/SecurityScanner';
import GlossaryIndex from './pages/glossary/GlossaryIndex';
import GlossaryTerm from './pages/glossary/GlossaryTerm';
import TrustBadgeGenerator from './pages/tools/TrustBadgeGenerator';
import StatusPage from './pages/StatusPage';

import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import ConnectAdsPage from './pages/ConnectAdsPage';
import CampaignsPage from './pages/CampaignsPage';
import OnboardingPage from './pages/OnboardingPage';
import ProfilePage from './pages/ProfilePage';

// Styles
import './index.css'
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <NotificationsProvider>
            <Routes>
              {/* Public Marketing Site */}
              <Route element={<MarketingLayout />}>
                <Route path="/" element={<LandingPageHebrew />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                
                {/* Hidden Landing Pages (PPC) */}
                <Route path="/lp/competitors" element={<CompetitorLP />} />
                <Route path="/lp/agencies" element={<AgencyLP />} />
                
                {/* Tools */}
                <Route path="/tools/scanner" element={<SecurityScanner />} />
                <Route path="/tools/badge" element={<TrustBadgeGenerator />} />
                
                {/* SEO Content */}
                <Route path="/glossary" element={<GlossaryIndex />} />
                <Route path="/glossary/:slug" element={<GlossaryTerm />} />

                {/* Trust */}
                <Route path="/status" element={<StatusPage />} />

                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
              </Route>
              
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* App Routes - Protected */}
              <Route path="/app/dashboard" element={<Dashboard />} />
              <Route path="/app/onboarding" element={<OnboardingPage />} />
              <Route path="/app/connect-ads" element={<ConnectAdsPage />} />
              <Route path="/app/campaigns/:accountId" element={<CampaignsPage />} />
              <Route path="/app/profile" element={<ProfilePage />} />
              
              {/* Fallback - 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </NotificationsProvider>
        </BrowserRouter>
        <Toaster position="top-center" />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);