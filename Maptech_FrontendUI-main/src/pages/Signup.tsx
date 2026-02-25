import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Phone, AtSign, ChevronDown, Loader2, Eye, EyeOff, X } from 'lucide-react';

const LOGO_SRC = '/Maptech%20Official%20Logo%20version2%20(1).png';

const SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/* ─── Policy / Terms content ─── */
const PRIVACY_POLICY = (
  <>
    <h2 className="text-lg font-bold text-white mb-4">Privacy Policy – Ticketing System</h2>
    <p className="mb-3 text-gray-300 text-sm leading-relaxed">This Privacy Policy explains how the Ticketing System, operated under the standards of Maptech Information Solutions Inc., collects, uses, stores, and protects personal data of users who access and use the System.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">1. Information We Collect</h3>
    <p className="text-gray-300 text-sm mb-1">We may collect the following categories of information:</p>
    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2 mb-3">
      <li><strong>Personal Information:</strong> Name, employee ID, email address, department, or other identifiers.</li>
      <li><strong>Ticket Information:</strong> Content of submitted tickets, including issue descriptions, attachments, and timestamps.</li>
      <li><strong>Usage Data:</strong> System logs such as login activity, device/browser details, and actions performed within the System.</li>
    </ul>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">2. How We Use Your Information</h3>
    <p className="text-gray-300 text-sm mb-1">Your data is used to:</p>
    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2 mb-3">
      <li>Process and respond to support requests.</li>
      <li>Track and manage ticket status.</li>
      <li>Generate internal reports to improve services.</li>
      <li>Notify you about ticket progress or resolution.</li>
      <li>Enhance user experience and system functionality.</li>
    </ul>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">3. Data Sharing and Disclosure</h3>
    <p className="text-gray-300 text-sm mb-1">We do not sell or share personal data externally. Data may be accessed by:</p>
    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2 mb-3">
      <li>Authorized support personnel (ticket agents, system administrators) for resolution purposes.</li>
      <li>Internal management for reporting, audits, or compliance.</li>
      <li>Legal authorities, when disclosure is required by law.</li>
    </ul>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">4. Data Retention</h3>
    <p className="text-gray-300 text-sm mb-3">Data is retained only as long as necessary to fulfill the purposes outlined or as required by organizational and regulatory policies.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">5. Your Rights</h3>
    <p className="text-gray-300 text-sm mb-1">You may:</p>
    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2 mb-2">
      <li>Access your personal data stored in the System.</li>
      <li>Request correction of inaccurate or outdated information.</li>
      <li>Request deletion of data, subject to retention requirements.</li>
      <li>Withdraw consent, which may affect your ability to use the System.</li>
    </ul>
    <p className="text-gray-300 text-sm mb-3">Requests should be directed to the Ticketing System administrators.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">6. Data Security</h3>
    <p className="text-gray-300 text-sm mb-3">We implement industry-standard technical and organizational safeguards, including authentication, access control, and continuous monitoring. While we strive for robust protection, no system is entirely immune to risk. Users are responsible for safeguarding their login credentials.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">7. Cookies and Tracking</h3>
    <p className="text-gray-300 text-sm mb-3">The System may use cookies or session-based tracking for authentication and analytics. You can manage cookie preferences through your browser.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">8. Policy Updates</h3>
    <p className="text-gray-300 text-sm mb-3">This Privacy Policy may be updated periodically. Significant changes will be communicated, and continued use of the System constitutes acceptance of the revised policy.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">9. Contact Us</h3>
    <p className="text-gray-300 text-sm">For questions or concerns, please contact the Ticketing System operators at <span className="text-[#3BC25B]">sales@maptechisi.com</span> or via the official Maptech channels.</p>
  </>
);

const TERMS_CONDITIONS = (
  <>
    <h2 className="text-lg font-bold text-white mb-4">Terms and Conditions – Ticketing System</h2>
    <p className="mb-3 text-gray-300 text-sm leading-relaxed">By accessing and using the Ticketing System, you agree to comply with the following Terms and Conditions.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">1. Acceptance of Terms</h3>
    <p className="text-gray-300 text-sm mb-3">Use of the System indicates that you have read, understood, and agreed to these Terms. If you do not agree, you must refrain from using the System.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">2. Purpose</h3>
    <p className="text-gray-300 text-sm mb-3">The System is designed to help employees and authorized personnel submit, track, and resolve technical or administrative issues within the organization.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">3. User Responsibilities</h3>
    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2 mb-3">
      <li>Provide accurate and complete information when submitting tickets.</li>
      <li>Use the System only for legitimate support requests.</li>
      <li>Avoid duplicate, irrelevant, or fraudulent submissions.</li>
      <li>Respond promptly to support team inquiries.</li>
      <li>Maintain professionalism in all communications.</li>
    </ul>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">4. Ticket Closure</h3>
    <p className="text-gray-300 text-sm mb-3">Tickets are closed once marked resolved by the support team. Inactivity beyond SLA timelines may result in automatic closure. Lack of cooperation or feedback may delay resolution.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">5. Account and Security</h3>
    <p className="text-gray-300 text-sm mb-3">Users are responsible for keeping login credentials secure. Accounts must not be shared or misused. Unauthorized access or suspicious activity must be reported immediately.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">6. Prohibited Actions</h3>
    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2 mb-3">
      <li>Misuse or disrupt the System.</li>
      <li>Upload harmful, offensive, or malicious content.</li>
      <li>Attempt unauthorized access to restricted areas.</li>
    </ul>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">7. System Availability</h3>
    <p className="text-gray-300 text-sm mb-3">The System is provided on an "as-is" and "as-available" basis. While we strive for reliability, we do not guarantee uninterrupted or error-free operation. Scheduled maintenance or unforeseen issues may affect availability.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">8. Limitation of Liability</h3>
    <p className="text-gray-300 text-sm mb-3">To the fullest extent permitted by law, the organization and its affiliates are not liable for indirect, incidental, or consequential damages arising from use of the System.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">9. Changes to Terms</h3>
    <p className="text-gray-300 text-sm mb-3">These Terms may be updated periodically. Significant changes will be communicated.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">10. Governing Law</h3>
    <p className="text-gray-300 text-sm mb-3">These Terms are governed by the laws of the Philippines, without regard to conflict of law principles.</p>

    <h3 className="text-sm font-semibold text-white mt-4 mb-2">11. Contact Information</h3>
    <p className="text-gray-300 text-sm">For inquiries, please contact the Ticketing System operators at <span className="text-[#3BC25B]">sales@maptechisi.com</span>.</p>
  </>
);

/* ─── Modal Component ─── */
function PolicyModal({
  open,
  step,
  onClose,
  onNext,
  onBack,
  onAgree,
}: {
  open: boolean;
  step: 'privacy' | 'terms';
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  onAgree: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reachedBottom, setReachedBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Consider "bottom" when within 20px of actual bottom
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) {
      setReachedBottom(true);
    }
  }, []);

  // Reset scroll state when step changes
  const prevStep = useRef(step);
  if (prevStep.current !== step) {
    prevStep.current = step;
    setReachedBottom(false);
    // scroll to top on next render
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0 }), 0);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-gray-900 border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-base font-semibold text-white">
            {step === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar"
        >
          {step === 'privacy' ? PRIVACY_POLICY : TERMS_CONDITIONS}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
          {step === 'privacy' ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onNext}
                disabled={!reachedBottom}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#63D44A] to-[#0E8F79] disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onBack}
                className="px-5 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={onAgree}
                disabled={!reachedBottom}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#63D44A] to-[#0E8F79] disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
              >
                I Agree
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function Signup() {
  const { user, registerClient, getRedirectPath } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'privacy' | 'terms'>('privacy');

  if (user) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
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
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      const redirectPath = await registerClient({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        acceptTerms,
      });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-transparent border-none py-2.5 pl-3 pr-4 text-white placeholder-gray-500 focus:outline-none text-sm";
  const wrapperClass = "relative flex items-center bg-gray-800 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-[#3BC25B] transition-all";

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl bg-gray-900 dark:bg-gray-900/90 border border-gray-800 shadow-xl p-8">
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

          {/* Name Row: First / Middle / Last */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">First Name <span className="text-red-400">*</span></label>
              <div className={wrapperClass}>
                <User className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Juan" className={inputClass} autoComplete="given-name" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Middle Name</label>
              <div className={wrapperClass}>
                <User className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
                <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Santos" className={inputClass} autoComplete="additional-name" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Last Name <span className="text-red-400">*</span></label>
              <div className={wrapperClass}>
                <User className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Dela Cruz" className={inputClass} autoComplete="family-name" />
              </div>
            </div>
          </div>

          {/* Suffix + Phone Number row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Suffix</label>
              <div className={wrapperClass}>
                <ChevronDown className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
                <select
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  className="w-full bg-transparent border-none py-2.5 pl-3 pr-8 text-white focus:outline-none text-sm appearance-none cursor-pointer"
                >
                  <option value="" className="bg-gray-800 text-gray-400">None</option>
                  {SUFFIX_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-gray-800 text-white">{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number <span className="text-red-400">*</span></label>
              <div className={wrapperClass}>
                <Phone className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 912 345 6789" className={inputClass} autoComplete="tel" />
              </div>
            </div>
          </div>

          {/* Username + Email row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Username <span className="text-red-400">*</span></label>
              <div className={wrapperClass}>
                <AtSign className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="juandelacruz" className={inputClass} autoComplete="username" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email <span className="text-red-400">*</span></label>
              <div className={wrapperClass}>
                <Mail className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={inputClass} autoComplete="email" />
              </div>
            </div>
          </div>

          {/* Password + Confirm Password row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password <span className="text-red-400">*</span></label>
              <div className={wrapperClass}>
                <Lock className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-none py-2.5 pl-3 pr-12 text-white placeholder-gray-500 focus:outline-none text-sm"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 p-1.5 text-gray-500 hover:text-gray-300" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Confirm Password <span className="text-red-400">*</span></label>
              <div className={wrapperClass}>
                <Lock className="w-4 h-4 text-gray-500 ml-3 flex-shrink-0" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-none py-2.5 pl-3 pr-12 text-white placeholder-gray-500 focus:outline-none text-sm"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 p-1.5 text-gray-500 hover:text-gray-300" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          {/* Accept Terms — checkbox is read-only, must go through modal */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={acceptTerms}
              readOnly
              className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-gray-800 text-[#3BC25B] focus:ring-[#3BC25B] cursor-not-allowed opacity-60"
            />
            <span className="text-sm text-gray-400">
              I agree to the{' '}
              <button type="button" onClick={() => { setModalStep('privacy'); setModalOpen(true); }} className="text-[#3BC25B] hover:underline font-medium">
                Privacy Policy
              </button>{' '}and{' '}
              <button type="button" onClick={() => { setModalStep('privacy'); setModalOpen(true); }} className="text-[#3BC25B] hover:underline font-medium">
                Terms of Service
              </button>
            </span>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-3.5 rounded-lg font-semibold text-white bg-gradient-to-r from-[#63D44A] to-[#0E8F79] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 mt-5">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Sign up with Google */}
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
          Sign up with Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#3BC25B] hover:text-[#63D44A] font-medium">
            Sign in
          </Link>
        </p>
      </div>

      {/* Privacy Policy / Terms Modal */}
      <PolicyModal
        open={modalOpen}
        step={modalStep}
        onClose={() => setModalOpen(false)}
        onNext={() => setModalStep('terms')}
        onBack={() => setModalStep('privacy')}
        onAgree={() => {
          setAcceptTerms(true);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
