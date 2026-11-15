import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { LanguageToggle } from '../../components/common/LanguageToggle';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

export const AdminLoginPage = () => {
  const { t, isHindi } = useLanguage();
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Mode: 'login' | 'reset'
  const [mode, setMode] = useState('login');

  const [email, setEmail] = useState('admin@panchayat.gov.in');
  const [password, setPassword] = useState('admin123');
  const [resetEmail, setResetEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(
    searchParams.get('reset') === 'success'
      ? (isHindi ? 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।' : 'Password reset link sent to your email.')
      : null
  );

  const unauthorizedNotice = location.state?.unauthorized;
  const from = location.state?.from?.pathname || '/admin/dashboard';

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      setError(
        err.message ||
          (isHindi
            ? 'अमान्य ईमेल या पासवर्ड अथवा आपके पास व्यवस्थापक अधिकार नहीं हैं।'
            : 'Invalid credentials or missing administrator privileges.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset Request
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await resetPassword(resetEmail || email);
      setSuccessMsg(
        isHindi
          ? 'पासवर्ड रीसेट निर्देश आपके आधिकारिक ईमेल पर भेज दिए गए हैं।'
          : 'Password reset instructions have been dispatched to your official email.'
      );
      setMode('login');
    } catch (err) {
      console.error('Password reset failed:', err);
      setError(err.message || (isHindi ? 'पासवर्ड रीसेट अनुरोध विफल रहा।' : 'Failed to send reset link.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@panchayat.gov.in');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-[82vh] flex flex-col items-center justify-center px-4 py-8 sm:py-12 bg-slate-50/50">
      <div className="w-full max-w-md space-y-5">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <LanguageToggle />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary-dark text-white mx-auto flex items-center justify-center shadow-md shadow-primary/10 border border-slate-700">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-dark">
            {mode === 'login' ? t('admin.loginTitle') : (isHindi ? 'पासवर्ड रीसेट करें' : 'Reset Admin Password')}
          </h1>
          <p className="text-xs sm:text-sm text-civic-muted max-w-xs mx-auto">
            {mode === 'login'
              ? t('admin.loginSubtitle')
              : (isHindi ? 'अपना पंजीकृत आधिकारिक ईमेल दर्ज करें।' : 'Enter your registered official email to receive a secure recovery link.')}
          </p>
        </div>

        {/* Unauthorized Redirection Alert */}
        {unauthorizedNotice && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {isHindi ? 'सुरक्षित क्षेत्र — लॉगिन अनिवार्य है' : 'Restricted Administrative Area'}
              </p>
              <p className="text-amber-800 text-xs mt-0.5">
                {isHindi
                  ? 'इस पृष्ठ को देखने के लिए अधिकृत ग्राम पंचायत अधिकारी लॉगिन आवश्यक है।'
                  : 'Authorized administrator credentials are required to access this dashboard.'}
              </p>
            </div>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Form Card */}
        <Card className="p-6 sm:p-8 space-y-5 bg-white border-civic-border shadow-xs">
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <Input
                label={t('admin.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@panchayat.gov.in"
                required
                autoComplete="email"
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-civic-text">
                    {t('admin.password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {isHindi ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                  </button>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 bg-rose-50 text-status-error text-xs rounded-xl border border-rose-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full font-bold min-h-[50px] shadow-2xs"
                isLoading={isLoading}
              >
                {isLoading ? t('admin.signingIn') : t('admin.signInBtn')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <Input
                label={isHindi ? 'आधिकारिक ईमेल दर्ज करें' : 'Enter Official Email'}
                type="email"
                value={resetEmail || email}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="admin@panchayat.gov.in"
                required
                autoComplete="email"
              />

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 p-3 bg-rose-50 text-status-error text-xs rounded-xl border border-rose-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="w-1/2 min-h-[48px] font-semibold"
                >
                  {isHindi ? 'वापस जाएं' : 'Back to Login'}
                </Button>
                <Button
                  type="submit"
                  size="md"
                  icon={KeyRound}
                  className="w-1/2 min-h-[48px] font-bold"
                  isLoading={isLoading}
                >
                  {isLoading ? (isHindi ? 'भेजा जा रहा है...' : 'Sending...') : (isHindi ? 'लिंक भेजें' : 'Send Link')}
                </Button>
              </div>
            </form>
          )}

          {/* Quick Demo Credentials Box */}
          <div className="p-3.5 bg-primary-light/60 rounded-xl border border-blue-200 text-xs text-primary-dark space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>{t('admin.demoNotice')}</span>
              </p>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-primary hover:underline font-bold text-xs"
              >
                {isHindi ? 'स्वतः भरें' : 'Auto Fill'}
              </button>
            </div>
            <p className="text-civic-muted flex items-center justify-between">
              <span>Email:</span>
              <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-primary-dark border border-blue-100">
                admin@panchayat.gov.in
              </code>
            </p>
            <p className="text-civic-muted flex items-center justify-between">
              <span>Password:</span>
              <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-primary-dark border border-blue-100">
                admin123
              </code>
            </p>
          </div>

          {/* Citizen Portal Return Link */}
          <div className="text-center pt-2 border-t border-slate-100">
            <Link
              to="/"
              className="text-xs font-semibold text-civic-muted hover:text-primary transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isHindi ? 'नागरिक पोर्टल पर लौटें' : 'Return to Citizen Grievance Portal'}</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
