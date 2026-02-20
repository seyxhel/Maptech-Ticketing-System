import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Building2, Loader2, Eye, EyeOff } from 'lucide-react';

const LOGO_SRC = '/Maptech%20Official%20Logo%20version2%20(1).png';

export function Signup() {
  const { user, registerClient, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    passwordsMatch &&
    acceptTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) return;
    if (!acceptTerms) {
      setError('You must agree to the Privacy Policy and Terms of Service.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const redirectPath = await registerClient({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        companyName: companyName.trim() || undefined,
        acceptTerms,
      });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-gray-900 dark:bg-gray-900/90 border border-gray-800 shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <img src={LOGO_SRC} alt="Maptech" className="h-16 w-auto object-contain" />
        </div>

        <h1 className="text-xl font-bold text-white text-center">Create Account</h1>
        <p className="text-sm text-gray-400 text-center mt-1 mb-6">Client registration</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
            <div className="relative flex items-center bg-gray-800 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-[#3BC25B] transition-all">
              <User className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-transparent border-none py-2.5 pl-3 pr-4 text-white placeholder-gray-500 focus:outline-none text-sm"
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
            <div className="relative flex items-center bg-gray-800 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-[#3BC25B] transition-all">
              <Mail className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-transparent border-none py-2.5 pl-3 pr-4 text-white placeholder-gray-500 focus:outline-none text-sm"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative flex items-center bg-gray-800 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-[#3BC25B] transition-all">
              <Lock className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-none py-2.5 pl-3 pr-12 text-white placeholder-gray-500 focus:outline-none text-sm"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1.5 text-gray-500 hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
            <div className="relative flex items-center bg-gray-800 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-[#3BC25B] transition-all">
              <Lock className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent border-none py-2.5 pl-3 pr-12 text-white placeholder-gray-500 focus:outline-none text-sm"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 p-1.5 text-gray-500 hover:text-gray-300"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Company Name</label>
            <div className="relative flex items-center bg-gray-800 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-[#3BC25B] transition-all">
              <Building2 className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
                className="w-full bg-transparent border-none py-2.5 pl-3 pr-4 text-white placeholder-gray-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-gray-800 text-[#3BC25B] focus:ring-[#3BC25B]"
            />
            <span className="text-sm text-gray-400">
              I agree to the <Link to="/privacy" className="text-[#3BC25B] hover:underline">Privacy Policy</Link> and{' '}
              <Link to="/terms" className="text-[#3BC25B] hover:underline">Terms of Service</Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-3.5 rounded-lg font-semibold text-white bg-gradient-to-r from-[#63D44A] to-[#0E8F79] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#3BC25B] hover:text-[#63D44A] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
