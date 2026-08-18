import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

// Google Client ID is public — safe to hardcode in frontend code
const GOOGLE_CLIENT_ID = '38192999166-c0oo3fsmqi7rpcltp0376c8miufutpmb.apps.googleusercontent.com';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleGoogleCredential = async (credential: string) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.googleLogin(credential);
      login(data.accessToken, data.user);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/programs');
      }
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          handleGoogleCredential(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleBtnRef.current.offsetWidth || 400,
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
    };

    // Load GSI script if not already loaded
    if (window.google) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);

    return () => {
      // cleanup: remove script if component unmounts before load
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing && !window.google) existing.remove();
    };
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const data = await api.login({ email, password });
      login(data.accessToken, data.user);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/programs');
      }
    } catch (err: any) {
      if (err.details && Array.isArray(err.details)) {
        const errorsObj: Record<string, string> = {};
        err.details.forEach((d: any) => {
          if (d.field) errorsObj[d.field] = d.message;
        });
        setFieldErrors(errorsObj);
      }
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-800">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold font-heading text-white">Admin Authentication</h2>
          <p className="text-xs text-slate-400 mt-1">Sign in to access your PosterCraft workspace</p>
        </div>

        {error && Object.keys(fieldErrors).length === 0 && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        {GOOGLE_CLIENT_ID ? (
          <div className="w-full mb-5 min-h-[44px] flex justify-center">
            <div ref={googleBtnRef} className="w-full" />
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-center">
            Google Sign-In is not configured. Set <code>VITE_GOOGLE_CLIENT_ID</code>.
          </div>
        )}

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Or continue with email</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <form noValidate onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            error={fieldErrors.email}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={fieldErrors.password}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-400">
            Need an admin or organizer account?{' '}
            <Link to="/register" className="text-indigo-400 font-bold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
