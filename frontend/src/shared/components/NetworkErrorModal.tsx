import React from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';

interface NetworkErrorModalProps {
  /** Whether to show the modal. */
  isOpen: boolean;
  /** Called when the user clicks "Retry". */
  onRetry: () => void;
  /** Called when the user clicks the close / dismiss button. */
  onDismiss?: () => void;
  /** Show spinner on the retry button while retrying. */
  retrying?: boolean;
  /** Optional custom title. */
  title?: string;
  /** Optional custom description. */
  description?: string;
}

/**
 * Full-screen overlay modal that appears when the app loses network connectivity.
 * Provides a "Retry" button and an optional dismiss action.
 *
 * Usage:
 * ```tsx
 * import { NetworkErrorModal } from '@/shared/components/NetworkErrorModal';
 * import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
 *
 * function MyPage() {
 *   const { isOffline, retry, dismiss, retrying } = useNetworkStatus(loadData);
 *   return (
 *     <>
 *       <NetworkErrorModal isOpen={isOffline} onRetry={retry} onDismiss={dismiss} retrying={retrying} />
 *       ...
 *     </>
 *   );
 * }
 * ```
 */
export function NetworkErrorModal({
  isOpen,
  onRetry,
  onDismiss,
  retrying = false,
  title = 'Connection Lost',
  description = 'Unable to connect to the server. Please check your internet connection and try again.',
}: NetworkErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="network-error-title"
      aria-describedby="network-error-desc"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in">
        {/* Close button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon header */}
        <div className="flex flex-col items-center pt-8 pb-2 px-6">
          <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-5 ring-8 ring-red-50/50 dark:ring-red-500/5">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
              <WifiOff className="w-7 h-7 text-red-500 dark:text-red-400" />
            </div>
          </div>

          <h2
            id="network-error-title"
            className="text-lg font-bold text-gray-900 dark:text-white text-center"
          >
            {title}
          </h2>
          <p
            id="network-error-desc"
            className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 leading-relaxed max-w-xs"
          >
            {description}
          </p>
        </div>

        {/* Animated pulse bar */}
        <div className="px-6 py-3">
          <div className="flex items-center gap-2 justify-center">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse [animation-delay:300ms]" />
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
              {retrying ? 'Reconnecting...' : 'Waiting for connection'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 flex flex-col gap-2.5">
          <button
            onClick={onRetry}
            disabled={retrying}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#63D44A] to-[#0E8F79] hover:shadow-lg hover:shadow-[#3BC25B]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry Connection'}
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
