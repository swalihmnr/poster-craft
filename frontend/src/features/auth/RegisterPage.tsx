import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { UserPlus, Mail, Phone, User, AlertCircle, ArrowRight, KeyRound, Timer, CheckCircle2, ShieldCheck, Send, Lock, Eye, EyeOff } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<'signup' | 'otp' | 'pending_approval'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Check localStorage for persisted signup timer
  useEffect(() => {
    const savedExpiry = localStorage.getItem('signup_otp_expiry');
    const savedEmail = localStorage.getItem('signup_saved_email');
    const savedName = localStorage.getItem('signup_saved_name');
    const savedPhone = localStorage.getItem('signup_saved_phone');
    const savedPassword = localStorage.getItem('signup_saved_password');

    if (savedExpiry) {
      const remaining = Math.ceil((parseInt(savedExpiry, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setTimerSeconds(remaining);
        setStep('otp');
        if (savedEmail) setEmail(savedEmail);
        if (savedName) setName(savedName);
        if (savedPhone) setPhone(savedPhone);
        if (savedPassword) setPassword(savedPassword);
      } else {
        localStorage.removeItem('signup_otp_expiry');
      }
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          localStorage.removeItem('signup_otp_expiry');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});
    setOtpMessage('');

    if (!password || password.length < 6) {
      setFieldErrors({ password: 'Password must be at least 6 characters' });
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.sendOtp(email);
      const expiry = Date.now() + 60 * 1000;
      localStorage.setItem('signup_otp_expiry', expiry.toString());
      localStorage.setItem('signup_saved_email', email);
      localStorage.setItem('signup_saved_name', name);
      localStorage.setItem('signup_saved_phone', phone);
      localStorage.setItem('signup_saved_password', password);

      setTimerSeconds(60);
      setStep('otp');
      setOtpMessage(res.message || `OTP sent to ${email}. (Code: ${res.otp || '******'})`);
    } catch (err: any) {
      if (err.details && Array.isArray(err.details)) {
        const errorsObj: Record<string, string> = {};
        err.details.forEach((d: any) => {
          if (d.field) errorsObj[d.field] = d.message;
        });
        setFieldErrors(errorsObj);
      }
      setError(err.message || 'Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const data = await api.verifyOtp({ email, otp, name, phone, password });
      localStorage.removeItem('signup_otp_expiry');
      localStorage.removeItem('signup_saved_email');
      localStorage.removeItem('signup_saved_name');
      localStorage.removeItem('signup_saved_phone');
      localStorage.removeItem('signup_saved_password');

      if (!data.user?.isSuperAdmin || data.user?.status === 'pending' || (data as any).requiresApproval) {
        setStep('pending_approval');
        return;
      }

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
      setError(err.message || 'Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignup = async () => {
    if (email) {
      api.cancelOtp(email).catch(() => {});
    }
    localStorage.removeItem('signup_otp_expiry');
    localStorage.removeItem('signup_saved_email');
    localStorage.removeItem('signup_saved_name');
    localStorage.removeItem('signup_saved_phone');
    setTimerSeconds(0);
    setOtp('');
    setOtpMessage('');
    setError('');
    setFieldErrors({});
    setStep('signup');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl relative z-10 border border-slate-800">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
            {step === 'signup' ? <UserPlus className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-extrabold font-heading text-white">
            {step === 'signup' ? 'Create Account' : 'Verify OTP Code'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 'signup'
              ? 'Enter your name, email, and phone number to sign up'
              : `Enter the 6-digit OTP sent to ${email}`}
          </p>
        </div>

        {error && Object.keys(fieldErrors).length === 0 && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {otpMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{otpMessage}</span>
          </div>
        )}

        {step === 'pending_approval' ? (
          <div className="text-center py-2 space-y-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative p-4 rounded-3xl bg-gradient-to-b from-emerald-500/20 to-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="w-10 h-10" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white font-heading tracking-tight">
                Request Sent Successfully!
              </h3>
              <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                Your OTP code is verified. Your registration request for PosterCraft Admin Access has been dispatched to the Super Admin.
              </p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 text-left space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-xs font-semibold text-slate-400">Applicant Details</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Timer className="w-3 h-3 animate-spin-slow" /> Pending Approval
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-white">{name || 'Admin Applicant'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email Address:</span>
                  <span className="font-mono text-indigo-300 font-bold">{email}</span>
                </div>
                {phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Phone Number:</span>
                    <span className="text-slate-200 font-medium">{phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                <Send className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Super Admin (<strong className="text-slate-200">swalimohd048@gmail.com</strong>) has been notified. You will receive an email once approved.
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full shadow-lg shadow-indigo-500/20"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </div>
        ) : step === 'signup' ? (
          <form noValidate onSubmit={handleSignupSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              error={fieldErrors.name}
            />

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
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
              error={fieldErrors.phone}
            />

            <Input
              label="Create Password"
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
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Submit & Send OTP Code
            </Button>
          </form>
        ) : (
          <form noValidate onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              label="6-Digit OTP Code"
              type="text"
              placeholder="e.g. 849201"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              maxLength={6}
              error={fieldErrors.otp}
            />

            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 font-mono">
                <Timer className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <span>
                  Expires in: <strong className="text-white">00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}</strong>
                </span>
              </div>

              {timerSeconds === 0 ? (
                <button
                  type="button"
                  onClick={handleSignupSubmit}
                  className="text-indigo-400 font-bold hover:underline"
                >
                  Resend OTP
                </button>
              ) : (
                <span className="text-slate-500 text-[10px]">Timer persisted across refresh</span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify & Enter System
            </Button>

            <button
              type="button"
              onClick={handleBackToSignup}
              className="w-full text-xs text-slate-400 hover:text-white font-medium text-center pt-2"
            >
              ← Edit Details & Cancel OTP
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
