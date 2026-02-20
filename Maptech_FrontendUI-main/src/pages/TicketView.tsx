import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Camera,
  X,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

type ProofType = 'screenshot' | 'image' | 'video';

interface ProofFile {
  name: string;
  preview?: string; // data URL for images
}

const PROOF_CONFIG: { key: ProofType; icon: typeof Camera; label: string }[] = [
  { key: 'screenshot', icon: Camera, label: 'Upload Screenshot' },
  { key: 'image', icon: ImageIcon, label: 'Upload Image' },
  { key: 'video', icon: Video, label: 'Upload Video' },
];

export function TicketView() {
  const navigate = useNavigate();
  const [proofFiles, setProofFiles] = useState<Record<ProofType, ProofFile | null>>({
    screenshot: null,
    image: null,
    video: null,
  });
  const [isResolved, setIsResolved] = useState(false);
  const [actionText, setActionText] = useState('');

  const hasAtLeastOneProof =
    !!proofFiles.screenshot || !!proofFiles.image || !!proofFiles.video;
  const canResolve = actionText.trim().length > 0 && hasAtLeastOneProof && !isResolved;

  const clearProof = useCallback((type: ProofType) => {
    setProofFiles((prev) => {
      const current = prev[type];
      if (current?.preview) URL.revokeObjectURL(current.preview);
      return { ...prev, [type]: null };
    });
  }, []);

  const setProof = useCallback((type: ProofType, file: File) => {
    const name = file.name;
    const isImage = type === 'screenshot' || type === 'image';
    const isVideo = type === 'video';

    if (isImage && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setProofFiles((prev) => {
        if (prev[type]?.preview) URL.revokeObjectURL(prev[type]!.preview!);
        return { ...prev, [type]: { name, preview: url } };
      });
      toast.success(`${type === 'screenshot' ? 'Screenshot' : 'Image'} uploaded`);
    } else if (isVideo && file.type.startsWith('video/')) {
      setProofFiles((prev) => ({ ...prev, [type]: { name } }));
      toast.success('Video uploaded');
    } else {
      setProofFiles((prev) => ({ ...prev, [type]: { name } }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded`);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, type: ProofType) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) setProof(type, file);
    },
    [setProof]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: ProofType) => {
      const file = e.target.files?.[0];
      if (file) setProof(type, file);
      e.target.value = '';
    },
    [setProof]
  );

  const handleResolve = () => {
    if (!actionText.trim()) {
      toast.error('Please describe the action taken before resolving.');
      return;
    }
    if (!hasAtLeastOneProof) {
      toast.error('Proof of service (image, screenshot, or video) is required before resolving this ticket.');
      return;
    }
    setIsResolved(true);
    toast.success('Ticket marked as resolved. Pending admin approval.');
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#0E8F79] dark:hover:text-green-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card accent>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">#TK-9012</span>
                <StatusBadge status="In Progress" />
                <PriorityBadge priority="Critical" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                Database connection failure in production
              </h1>
            </div>
            <div className="text-right ml-6 flex-shrink-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">SLA Timer</div>
              <SLATimer hoursRemaining={1} totalHours={4} />
            </div>
          </div>

          <div className="text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4 mt-2 space-y-3 text-sm leading-relaxed">
            <p>
              We are experiencing intermittent connection timeouts with the main PostgreSQL database cluster. This
              started happening around 10:00 AM EST.
            </p>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Steps to reproduce:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-600 dark:text-blue-400">
                <li>Login to the main portal</li>
                <li>Navigate to the &quot;Reports&quot; section</li>
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

        <Card className="border-l-4 border-l-[#3BC25B]">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Employee Actions</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Action Taken <span className="text-red-500">*</span>
              </label>
              <textarea
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none resize-none text-sm min-h-[140px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Describe the steps taken to resolve this issue..."
              />
            </div>

            {/* Required proof: at least one of screenshot / image / video */}
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                Required proof (at least one)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PROOF_CONFIG.map(({ key, icon: Icon, label }) => {
                  const file = proofFiles[key];
                  const isUploaded = !!file;
                  return (
                    <div
                      key={key}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => handleDrop(e, key)}
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        isUploaded
                          ? 'border-[#3BC25B] bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-[#3BC25B] hover:bg-green-50 dark:hover:bg-green-900/10'
                      }`}
                    >
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded">
                          Required
                        </span>
                      </div>
                      <input
                        type="file"
                        accept={key === 'video' ? 'video/*' : 'image/*'}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleFileInput(e, key)}
                        title={`Upload ${label}`}
                      />
                      {isUploaded ? (
                        <div className="flex flex-col items-center text-[#0E8F79] dark:text-green-400">
                          {file.preview ? (
                            <div className="relative w-full h-24 mb-2 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                              <img
                                src={file.preview}
                                alt="Preview"
                                className="w-full h-full object-contain"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  clearProof(key);
                                }}
                                className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white hover:bg-black/70"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <CheckCircle2 className="w-8 h-8 mb-2" />
                          )}
                          <span className="text-xs font-bold">Uploaded</span>
                          <span className="text-[10px] opacity-70 mt-0.5 truncate w-full px-1">{file.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400 pointer-events-none">
                          <Icon className="w-8 h-8 mb-2" />
                          <span className="text-xs font-bold">{label}</span>
                          <span className="text-[10px] text-red-400 mt-1">Drag and drop or click to upload</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {!hasAtLeastOneProof && (
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                Proof of service (image, screenshot, or video) is required before resolving this ticket.
              </p>
            )}

            <button
              onClick={handleResolve}
              disabled={!canResolve}
              className={`w-full py-4 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 text-base ${
                isResolved
                  ? 'bg-[#3BC25B] cursor-default'
                  : canResolve
                    ? 'bg-gradient-to-r from-[#63D44A] to-[#0E8F79] hover:shadow-lg hover:shadow-[#3BC25B]/30 cursor-pointer'
                    : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-400 dark:text-gray-500'
              }`}
            >
              {isResolved ? (
                <>
                  <Check className="w-5 h-5" /> Resolved & Submitted
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Mark as Resolved
                </>
              )}
            </button>

            {!canResolve && !isResolved && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 -mt-2">
                {!actionText.trim() && !hasAtLeastOneProof
                  ? 'Fill in Action Taken and upload at least one proof (image, screenshot, or video) to enable resolution.'
                  : !actionText.trim()
                    ? 'Describe the action taken to enable resolution.'
                    : 'Upload at least one proof (image, screenshot, or video) to enable resolution.'}
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h3 className="font-bold text-gray-900 dark:text-white mb-5 text-base">Ticket Details</h3>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Client</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">FinTech Corp</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Product</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Enterprise Server X1</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Support Type</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium border border-purple-200 dark:border-purple-700">
                Remote Session
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Warranty</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium border border-green-200 dark:border-green-700">
                Active (Exp: 2025)
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-base">Actions</h3>
          <div className="space-y-3">
            <GreenButton variant="outline" fullWidth>Escalate Ticket</GreenButton>
            <GreenButton variant="outline" fullWidth>Cascade to Vendor</GreenButton>
            <button className="w-full py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              Reject Ticket
            </button>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
