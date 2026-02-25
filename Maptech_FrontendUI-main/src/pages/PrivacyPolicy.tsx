import React from 'react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-xl bg-gray-900 border border-gray-800 shadow-xl p-8">
        <h1 className="text-xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-6">
          This page will display the full Privacy Policy when provided. By signing up, you agree to the terms outlined here.
        </p>
        <Link to="/signup" className="text-[#3BC25B] hover:text-[#63D44A] text-sm font-medium">
          Back to Sign up
        </Link>
      </div>
    </div>
  );
}
