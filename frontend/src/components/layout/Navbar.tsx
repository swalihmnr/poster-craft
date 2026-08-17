import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Button } from '../ui/Button';
import {
  Sparkles,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div>
              <span className="text-xl font-black font-heading tracking-tight text-white flex items-center gap-1">
                Poster<span className="gradient-text">Craft</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800">
            <Link
              to="/programs"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive('/programs')
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Programs / Events
            </Link>

            {user?.role === 'admin' && (
              <>
                <Link
                  to="/admin"
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive('/admin')
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-indigo-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Admin Dashboard
                </Link>

                <Link
                  to="/admin/templates"
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive('/admin/templates')
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Templates
                </Link>

                <Link
                  to="/admin/assets"
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive('/admin/assets')
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Assets
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <span className="block text-xs font-bold text-slate-200 leading-tight">
                      {user.name === 'Super Admin' ? 'PosterCraft Admin' : user.name}
                    </span>
                    <span className="block text-[10px] uppercase font-semibold text-indigo-400">
                      {user.role}
                    </span>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={handleLogout} title="Log Out">
                  <LogOut className="w-4 h-4 text-slate-400 hover:text-red-400" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="secondary" size="sm" leftIcon={<UserIcon className="w-3.5 h-3.5 text-indigo-400" />}>
                    Admin Login
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/programs"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            Explore Programs
          </Link>

          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-300 hover:bg-slate-900 border border-slate-800/60"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/admin/templates"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-slate-900 border border-slate-800/60"
              >
                Template Editor
              </Link>
              <Link
                to="/admin/assets"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 hover:bg-slate-900 border border-slate-800/60"
              >
                Asset Manager
              </Link>
            </>
          )}

          <div className="pt-3 border-t border-slate-900">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {user.name === 'Super Admin' ? 'PosterCraft Admin' : user.name}
                    </div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Log Out
                </Button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="secondary" size="sm" className="w-full">
                  Admin Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
