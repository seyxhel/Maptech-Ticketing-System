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
