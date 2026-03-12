import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-xl bg-gray-900 border border-gray-800 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#0E8F79]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#3BC25B]" />
          </div>
          <h1 className="text-xl font-bold text-white">Privacy Policy</h1>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          <p className="text-gray-300 text-sm leading-relaxed">This Privacy Policy explains how the Ticketing System, operated under the standards of Maptech Information Solutions Inc., collects, uses, stores, and protects personal data of users who access and use the System.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">1. Information We Collect</h3>
          <p className="text-gray-300 text-sm mb-1">We may collect the following categories of information:</p>
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2">
            <li><strong>Personal Information:</strong> Name, employee ID, email address, department, or other identifiers.</li>
            <li><strong>Ticket Information:</strong> Content of submitted tickets, including issue descriptions, attachments, and timestamps.</li>
            <li><strong>Usage Data:</strong> System logs such as login activity, device/browser details, and actions performed within the System.</li>
          </ul>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">2. How We Use Your Information</h3>
          <p className="text-gray-300 text-sm mb-1">Your data is used to:</p>
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2">
            <li>Process and respond to support requests.</li>
            <li>Track and manage ticket status.</li>
            <li>Generate internal reports to improve services.</li>
            <li>Notify you about ticket progress or resolution.</li>
            <li>Enhance user experience and system functionality.</li>
          </ul>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">3. Data Sharing and Disclosure</h3>
          <p className="text-gray-300 text-sm mb-1">We do not sell or share personal data externally. Data may be accessed by:</p>
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2">
            <li>Authorized support personnel (ticket agents, system administrators) for resolution purposes.</li>
            <li>Internal management for reporting, audits, or compliance.</li>
            <li>Legal authorities, when disclosure is required by law.</li>
          </ul>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">4. Data Retention</h3>
          <p className="text-gray-300 text-sm">Data is retained only as long as necessary to fulfill the purposes outlined or as required by organizational and regulatory policies.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">5. Your Rights</h3>
          <p className="text-gray-300 text-sm mb-1">You may:</p>
          <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-2">
            <li>Access your personal data stored in the System.</li>
            <li>Request correction of inaccurate or outdated information.</li>
            <li>Request deletion of data, subject to retention requirements.</li>
            <li>Withdraw consent, which may affect your ability to use the System.</li>
          </ul>
          <p className="text-gray-300 text-sm mt-1">Requests should be directed to the Ticketing System administrators.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">6. Data Security</h3>
          <p className="text-gray-300 text-sm">We implement industry-standard technical and organizational safeguards, including authentication, access control, and continuous monitoring. While we strive for robust protection, no system is entirely immune to risk. Users are responsible for safeguarding their login credentials.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">7. Cookies and Tracking</h3>
          <p className="text-gray-300 text-sm">The System may use cookies or session-based tracking for authentication and analytics. You can manage cookie preferences through your browser.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">8. Policy Updates</h3>
          <p className="text-gray-300 text-sm">This Privacy Policy may be updated periodically. Significant changes will be communicated, and continued use of the System constitutes acceptance of the revised policy.</p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-2">9. Contact Us</h3>
          <p className="text-gray-300 text-sm">For questions or concerns, please contact the Ticketing System operators at <span className="text-[#3BC25B]">sales@maptechisi.com</span> or via the official Maptech channels.</p>
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
