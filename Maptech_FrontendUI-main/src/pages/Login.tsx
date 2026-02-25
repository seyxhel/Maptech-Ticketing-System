import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

const LOGO_SRC = '/Maptech%20Official%20Logo%20version2%20(1).png';

export function Login() {
  const { user, loginWithCredentials, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) return;
    setLoading(true);
    try {
      const redirectPath = await loginWithCredentials(email.trim(), password, rememberMe);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-gray-900 dark:bg-gray-900/90 border border-gray-800 shadow-xl p-8">
        {/* Logo above form */}
        <div className="flex justify-center mb-8">
          <img
            src={LOGO_SRC}
            alt="Maptech"
            className="h-20 w-auto object-contain"
          />
        </div>

        <h1 className="text-xl font-bold text-white text-center">Welcome Back</h1>
        <p className="text-sm text-gray-400 text-center mt-1 mb-6">Sign in to Maptech Ticketing</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center bg-gray-800 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-[#3BC25B] focus-within:border-[#3BC25B] transition-all">
              <Mail className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-transparent border-none py-3 pl-3 pr-4 text-white placeholder-gray-500 focus:outline-none text-sm"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center bg-gray-800 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-[#3BC25B] focus-within:border-[#3BC25B] transition-all">
              <Lock className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-none py-3 pl-3 pr-12 text-white placeholder-gray-500 focus:outline-none text-sm"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1.5 text-gray-500 hover:text-gray-300 rounded transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#3BC25B] focus:ring-[#3BC25B]"
              />
              <span className="text-sm text-gray-400">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[#3BC25B] hover:text-[#63D44A] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-3.5 rounded-lg font-semibold text-white bg-gradient-to-r from-[#63D44A] to-[#0E8F79] hover:shadow-lg hover:shadow-[#3BC25B]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-6">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Continue with Google */}
        <button
          type="button"
          className="w-full mt-4 py-3 rounded-lg font-semibold text-white bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:border-gray-600 flex items-center justify-center gap-3 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-[#3BC25B] hover:text-[#63D44A] font-medium">
            Sign up
          </Link>
        </p>

        <div className="mt-6 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Test credentials (no backend)</p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li><span className="text-gray-400">SuperAdmin:</span> superadmin@test.com / superadmin</li>
            <li><span className="text-gray-400">Admin:</span> admin@test.com / admin</li>
            <li><span className="text-gray-400">Employee:</span> employee@test.com / employee</li>
            <li><span className="text-gray-400">Client:</span> client@test.com / client</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
