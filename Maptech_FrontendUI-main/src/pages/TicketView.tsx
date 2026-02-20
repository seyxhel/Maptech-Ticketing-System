import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityBadge } from '../components/ui/PriorityBadge';
import { SLATimer } from '../components/ui/SLATimer';
import {
  CheckCircle2,
  Video,
  Image as ImageIcon,
  Check,
  Camera } from
'lucide-react';
import { toast } from 'sonner';
export function TicketView() {
  const [uploads, setUploads] = useState({
    screenshot: false,
    image: false,
    video: false
  });
  const [isResolved, setIsResolved] = useState(false);
  const [actionText, setActionText] = useState('');
  const handleUpload = (type: 'screenshot' | 'image' | 'video') => {
    setTimeout(() => {
      setUploads((prev) => ({
        ...prev,
        [type]: true
      }));
      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`
      );
    }, 600);
  };
  const handleResolve = () => {
    if (!uploads.screenshot || !uploads.image || !uploads.video) {
      toast.error('Please complete all required uploads before resolving.');
      return;
    }
    if (!actionText.trim()) {
      toast.error('Please describe the action taken before resolving.');
      return;
    }
    setIsResolved(true);
    toast.success('Ticket marked as resolved. Pending admin approval.');
  };
  const allUploaded = uploads.screenshot && uploads.image && uploads.video;
  const canResolve = allUploaded && actionText.trim().length > 0;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Ticket Header */}
        <Card accent>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                  #TK-9012
                </span>
                <StatusBadge status="In Progress" />
                <PriorityBadge priority="Critical" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                Database connection failure in production
              </h1>
            </div>
            <div className="text-right ml-6 flex-shrink-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                SLA Timer
              </div>
              <SLATimer hoursRemaining={1} totalHours={4} />
            </div>
          </div>

          <div className="text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2 space-y-3 text-sm leading-relaxed">
            <p>
              We are experiencing intermittent connection timeouts with the main
              PostgreSQL database cluster. This started happening around 10:00
              AM EST.
            </p>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                Steps to reproduce:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-600 dark:text-blue-400">
                <li>Login to the main portal</li>
                <li>Navigate to the "Reports" section</li>
                <li>Try to generate a monthly summary</li>
              </ol>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
              <ImageIcon className="w-4 h-4" />
              error_screenshot.png
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
              <Video className="w-4 h-4" />
              screen_recording.mp4
            </div>
          </div>
        </Card>

        {/* Employee Actions */}
        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Employee Actions
          </h3>

          <div className="space-y-6">
            {/* Action Taken */}
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Action Taken <span className="text-red-500">*</span>
              </label>
              <textarea
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none resize-none text-sm min-h-[140px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Describe the steps taken to resolve this issue..." />

            </div>

            {/* Upload Zones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
              {
                key: 'screenshot' as const,
                icon: Camera,
                label: 'Upload Screenshot *',
                filename: 'screenshot_final.png'
              },
              {
                key: 'image' as const,
                icon: ImageIcon,
                label: 'Upload Image *',
                filename: 'proof_image.jpg'
              },
              {
                key: 'video' as const,
                icon: Video,
                label: 'Upload Video *',
                filename: 'recording.mp4'
              }].
              map(({ key, icon: Icon, label, filename }) =>
              <div
                key={key}
                onClick={() => !uploads[key] && handleUpload(key)}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all
                    ${uploads[key] ? 'border-[#3BC25B] bg-green-50 dark:bg-green-900/20 cursor-default' : 'border-gray-300 dark:border-gray-600 hover:border-[#3BC25B] hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer'}`}>

                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                      Required
                    </span>
                  </div>
                  {uploads[key] ?
                <div className="flex flex-col items-center text-[#0E8F79] dark:text-green-400">
                      <CheckCircle2 className="w-8 h-8 mb-2" />
                      <span className="text-xs font-bold">Uploaded</span>
                      <span className="text-[10px] opacity-70 mt-0.5">
                        {filename}
                      </span>
                    </div> :

                <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                      <Icon className="w-8 h-8 mb-2" />
                      <span className="text-xs font-bold">{label}</span>
                      <span className="text-[10px] text-red-400 mt-1">
                        Required before resolution
                      </span>
                    </div>
                }
                </div>
              )}
            </div>

            {/* Mark as Resolved Button */}
            <button
              onClick={handleResolve}
              disabled={isResolved || !canResolve}
              className={`w-full py-4 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 text-base
                ${isResolved ? 'bg-[#3BC25B] cursor-default' : canResolve ? 'bg-gradient-to-r from-[#63D44A] to-[#0E8F79] hover:shadow-lg hover:shadow-[#3BC25B]/30 cursor-pointer' : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-400 dark:text-gray-500'}`}>

              {isResolved ?
              <>
                  <Check className="w-5 h-5" /> Resolved & Submitted
                </> :

              <>
                  <CheckCircle2 className="w-5 h-5" /> Mark as Resolved
                </>
              }
            </button>

            {!canResolve && !isResolved &&
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 -mt-2">
                {!allUploaded && !actionText.trim() ?
              'Complete all uploads and describe the action taken to resolve' :
              !allUploaded ?
              'Upload all required files to enable resolution' :
              'Describe the action taken to enable resolution'}
              </p>
            }
          </div>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Ticket Details */}
        <Card>
          <h3 className="font-bold text-gray-900 dark:text-white mb-5 text-base">
            Ticket Details
          </h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                Client
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                FinTech Corp
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                Product
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Enterprise Server X1
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                Support Type
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium border border-purple-200 dark:border-purple-700">
                Remote Session
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                Warranty
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium border border-green-200 dark:border-green-700">
                Active (Exp: 2025)
              </span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card>
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-base">
            Actions
          </h3>
          <div className="space-y-3">
            <GreenButton variant="outline" fullWidth>
              Escalate Ticket
            </GreenButton>
            <GreenButton variant="outline" fullWidth>
              Cascade to Vendor
            </GreenButton>
            <button className="w-full py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              Reject Ticket
            </button>
          </div>
        </Card>
      </div>
    </div>);

}