import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ProgramListPage } from './features/programs/ProgramListPage';
import { PosterCreatorPage } from './features/poster/PosterCreatorPage';
import { AdminDashboardPage } from './features/admin/AdminDashboardPage';
import { AdminProgramsPage } from './features/admin/AdminProgramsPage';
import { AdminTemplateEditorPage } from './features/admin/AdminTemplateEditorPage';
import { AdminAssetsPage } from './features/admin/AdminAssetsPage';

import { ToastContainer } from './components/ui/Toast';

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
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Route wrapper for guests (redirects logged-in users away from login/register)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/programs'} replace />;
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
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
