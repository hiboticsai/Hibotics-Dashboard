import React, { useState, useEffect, useRef, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TenantProvider, useTenant } from './contexts/TenantContext';

// Pages
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import ClientDashboard from './pages/portal/Dashboard';
import CallsPage from './pages/portal/CallsPage';
import LeadsPage from './pages/portal/LeadsPage';
import SocialPage from './pages/portal/SocialPage';
import ReportsPage from './pages/portal/ReportsPage';
import SettingsPage from './pages/portal/SettingsPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCompanies from './pages/admin/CompaniesPage';
import AdminUsers from './pages/admin/UsersPage';
import AdminAgents from './pages/admin/AgentsPage';
import AdminBilling from './pages/admin/BillingPage';
import OnboardingManagement from './pages/admin/OnboardingManagement';
import OnboardingDetail from './pages/admin/OnboardingDetail';
import OnboardingWizard from './pages/onboarding/OnboardingWizard';
import OnboardingSuccess from './pages/onboarding/OnboardingSuccess';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Portal Route - loads tenant branding
const PortalRoute = ({ children }) => {
  const { slug } = useParams();
  const { loadCompanyBySlug, loading, error } = useTenant();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (slug && !loaded) {
      loadCompanyBySlug(slug)
        .then(() => setLoaded(true))
        .catch(() => {
          // Company not found, redirect to login
          navigate('/login');
        });
    }
  }, [slug, loadCompanyBySlug, navigate, loaded]);

  if (loading || !loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Company Not Found</h1>
          <p className="text-muted-foreground">The portal you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return children;
};

// Home redirect based on user role
const HomeRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // For clients, redirect to their company portal if they have one
  if (user?.company_id) {
    // We'd need the slug - for now redirect to login with message
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/login" replace />;
};

// Main App Router
function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />
      <Route path="/onboarding/success" element={<OnboardingSuccess />} />
      
      {/* Home - redirects based on role */}
      <Route path="/" element={<HomeRedirect />} />
      
      {/* Client Portal Routes */}
      <Route path="/portal/:slug" element={
        <ProtectedRoute>
          <PortalRoute>
            <ClientDashboard />
          </PortalRoute>
        </ProtectedRoute>
      } />
      <Route path="/portal/:slug/calls" element={
        <ProtectedRoute>
          <PortalRoute>
            <CallsPage />
          </PortalRoute>
        </ProtectedRoute>
      } />
      <Route path="/portal/:slug/leads" element={
        <ProtectedRoute>
          <PortalRoute>
            <LeadsPage />
          </PortalRoute>
        </ProtectedRoute>
      } />
      <Route path="/portal/:slug/social" element={
        <ProtectedRoute>
          <PortalRoute>
            <SocialPage />
          </PortalRoute>
        </ProtectedRoute>
      } />
      <Route path="/portal/:slug/reports" element={
        <ProtectedRoute>
          <PortalRoute>
            <ReportsPage />
          </PortalRoute>
        </ProtectedRoute>
      } />
      <Route path="/portal/:slug/settings" element={
        <ProtectedRoute>
          <PortalRoute>
            <SettingsPage />
          </PortalRoute>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/companies" element={
        <ProtectedRoute requireAdmin>
          <AdminCompanies />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin>
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/admin/agents" element={
        <ProtectedRoute requireAdmin>
          <AdminAgents />
        </ProtectedRoute>
      } />
      <Route path="/admin/billing" element={
        <ProtectedRoute requireAdmin>
          <AdminBilling />
        </ProtectedRoute>
      } />
      <Route path="/admin/onboarding" element={
        <ProtectedRoute requireAdmin>
          <OnboardingManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/onboarding/:submissionId" element={
        <ProtectedRoute requireAdmin>
          <OnboardingDetail />
        </ProtectedRoute>
      } />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <ThemeProvider defaultTheme="dark">
        <BrowserRouter>
          <AuthProvider>
            <TenantProvider>
              <AppRouter />
              <Toaster position="bottom-right" />
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
}

export default App;
