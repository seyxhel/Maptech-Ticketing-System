import React from 'react';
import { Link } from 'react-router-dom';

const LOGO_SRC = '/Maptech%20Official%20Logo%20version2%20(1).png';

export function ForgotPassword() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl bg-gray-900 border border-gray-800 shadow-xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <img src={LOGO_SRC} alt="Maptech" className="h-16 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-bold text-white">Forgot Password</h1>
        <p className="text-sm text-gray-400 mt-2 mb-6">
          Password reset will be available when connected to the backend. Contact your administrator for now.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-medium text-[#3BC25B] hover:text-[#63D44A] transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
