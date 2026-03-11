import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-xl bg-gray-900 border border-gray-800 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#0E8F79]/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#3BC25B]" />
          </div>
          <h1 className="text-xl font-bold text-white">Terms of Service</h1>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <p className="text-gray-300 text-sm leading-relaxed">By accessing and using the Ticketing System, you agree to comply with the following Terms and Conditions.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">1. Acceptance of Terms</h3>
          <p className="text-gray-300 text-sm">Use of the System indicates that you have read, understood, and agreed to these Terms. If you do not agree, you must refrain from using the System.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">2. Purpose</h3>
          <p className="text-gray-300 text-sm">The System is designed to help technicals and authorized personnel submit, track, and resolve technical or administrative issues within the organization.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">3. User Responsibilities</h3>
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2">
            <li>Provide accurate and complete information when submitting tickets.</li>
            <li>Use the System only for legitimate support requests.</li>
            <li>Avoid duplicate, irrelevant, or fraudulent submissions.</li>
            <li>Respond promptly to support team inquiries.</li>
            <li>Maintain professionalism in all communications.</li>
          </ul>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">4. Ticket Closure</h3>
          <p className="text-gray-300 text-sm">Tickets are closed once marked resolved by the support team. Inactivity beyond SLA timelines may result in automatic closure. Lack of cooperation or feedback may delay resolution.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">5. Account and Security</h3>
          <p className="text-gray-300 text-sm">Users are responsible for keeping login credentials secure. Accounts must not be shared or misused. Unauthorized access or suspicious activity must be reported immediately.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">6. Prohibited Actions</h3>
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2">
            <li>Misuse or disrupt the System.</li>
            <li>Upload harmful, offensive, or malicious content.</li>
            <li>Attempt unauthorized access to restricted areas.</li>
          </ul>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">7. System Availability</h3>
          <p className="text-gray-300 text-sm">The System is provided on an "as-is" and "as-available" basis. While we strive for reliability, we do not guarantee uninterrupted or error-free operation. Scheduled maintenance or unforeseen issues may affect availability.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">8. Limitation of Liability</h3>
          <p className="text-gray-300 text-sm">To the fullest extent permitted by law, the organization and its affiliates are not liable for indirect, incidental, or consequential damages arising from use of the System.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">9. Changes to Terms</h3>
          <p className="text-gray-300 text-sm">These Terms may be updated periodically. Significant changes will be communicated.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">10. Governing Law</h3>
          <p className="text-gray-300 text-sm">These Terms are governed by the laws of the Philippines, without regard to conflict of law principles.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">11. Contact Information</h3>
          <p className="text-gray-300 text-sm">For inquiries, please contact the Ticketing System operators at <span className="text-[#3BC25B]">sales@maptechisi.com</span>.</p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-[#3BC25B] hover:text-[#63D44A] text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
