import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const LOGO_SRC = '/Maptech%20Official%20Logo%20version2%20(1).png';

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <img src={LOGO_SRC} alt="Maptech" className="h-16 w-auto object-contain opacity-60" />
        </div>
        <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#63D44A] to-[#0E8F79] mb-4">
          404
        </h1>
        <h2 className="text-xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-sm text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#63D44A] to-[#0E8F79] hover:shadow-lg hover:shadow-[#3BC25B]/20 transition-all"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
