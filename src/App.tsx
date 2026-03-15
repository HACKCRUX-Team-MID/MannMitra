import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';

/* ──── Teammate's Landing Page Components ──── */
import { HeroSection } from './components/landing/hero-section';
import { FeaturesSection } from './components/landing/features-section';
import { PrivacySection } from './components/landing/privacy-section';
import { CTASection } from './components/landing/cta-section';
import { LandingNav } from './components/landing/landing-nav';
import { Footer } from './components/landing/footer';

/* ──── Teammate's App Shell ──── */
import { MobileHeader } from './components/app/mobile-header';
import { MobileNav } from './components/app/mobile-nav';
import { AppNav } from './components/app/app-nav';

/* ──── Our Pages (using teammate's UI + our AI backend) ──── */
import Journal from './pages/Journal';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import Companion from './pages/Companion';
import MoodPrediction from './pages/MoodPrediction';
import Settings from './pages/Settings';

/* ──── Landing Page (teammate's design) ──── */
function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PrivacySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

/* ──── Auth Guard ──── */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

/* ──── App Shell (wraps authenticated pages) ──── */
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Desktop nav */}
      <div className="hidden md:block">
        <AppNav />
      </div>
      {/* Mobile header */}
      <div className="md:hidden">
        <MobileHeader />
      </div>

      <main className="mx-auto w-full max-w-2xl flex-1 overflow-auto pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}

/* ──── Main Routes ──── */
function AppRoutes() {
  return (
    <Routes>
      {/* Public pages — no shell */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      {/* Authenticated pages — wrapped in AppShell */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <AppShell><Dashboard /></AppShell>
        </PrivateRoute>
      } />
      <Route path="/journal" element={
        <PrivateRoute>
          <AppShell><Journal /></AppShell>
        </PrivateRoute>
      } />
      <Route path="/insights" element={
        <PrivateRoute>
          <AppShell><Insights /></AppShell>
        </PrivateRoute>
      } />
      <Route path="/companion" element={
        <PrivateRoute>
          <AppShell><Companion /></AppShell>
        </PrivateRoute>
      } />
      <Route path="/mood-prediction" element={
        <PrivateRoute>
          <AppShell><MoodPrediction /></AppShell>
        </PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute>
          <AppShell><Settings /></AppShell>
        </PrivateRoute>
      } />
    </Routes>
  );
}

/* ──── Root ──── */
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}
