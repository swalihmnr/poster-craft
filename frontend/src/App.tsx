import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/ui/Toast';

// Lazy-loaded pages — each becomes its own JS chunk (fixes 938kB bundle warning)
const LoginPage              = lazy(() => import('./features/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage           = lazy(() => import('./features/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ProgramListPage        = lazy(() => import('./features/programs/ProgramListPage').then(m => ({ default: m.ProgramListPage })));
const PosterCreatorPage      = lazy(() => import('./features/poster/PosterCreatorPage').then(m => ({ default: m.PosterCreatorPage })));
const AdminDashboardPage     = lazy(() => import('./features/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const AdminProgramsPage      = lazy(() => import('./features/admin/AdminProgramsPage').then(m => ({ default: m.AdminProgramsPage })));
const AdminTemplateEditorPage = lazy(() => import('./features/admin/AdminTemplateEditorPage').then(m => ({ default: m.AdminTemplateEditorPage })));
const AdminAssetsPage        = lazy(() => import('./features/admin/AdminAssetsPage').then(m => ({ default: m.AdminAssetsPage })));

const queryClient = new QueryClient();

const LoadingScreen: React.FC = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-400">Verifying session...</span>
  </div>
);

// Protected route wrapper for Admin role
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  // Require both a valid admin session AND an explicit login this browser session.
  // This prevents auto-redirecting into the admin area from a restored cookie session.
  const hasExplicitLogin = sessionStorage.getItem('explicit_login') === '1';
  if (!user || user.role !== 'admin' || !hasExplicitLogin) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Route wrapper for guests (redirects logged-in users away from login/register)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (user) {
    // Always send to /programs — admin reaches /admin via explicit navigation
    return <Navigate to="/programs" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ToastContainer />
          <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
            <Navbar />
            <main className="flex-1">
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                <Route path="/" element={<Navigate to="/programs" replace />} />
                <Route path="/programs" element={<ProgramListPage />} />
                <Route path="/create/:programId" element={<PosterCreatorPage />} />
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <LoginPage />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <RegisterPage />
                    </PublicOnlyRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/programs"
                  element={
                    <AdminRoute>
                      <AdminProgramsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/templates"
                  element={
                    <AdminRoute>
                      <AdminTemplateEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/assets"
                  element={
                    <AdminRoute>
                      <AdminAssetsPage />
                    </AdminRoute>
                  }
                />

                  {/* Catch all fallback */}
                  <Route path="*" element={<Navigate to="/programs" replace />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
