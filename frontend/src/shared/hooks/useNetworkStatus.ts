import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  /** True when the browser reports no connection or a fetch health-check fails. */
  isOffline: boolean;
  /** Manually trigger a retry — calls the provided retryFn and re-checks connectivity. */
  retry: () => void;
  /** Dismiss the modal without retrying (user can close it). */
  dismiss: () => void;
  /** Whether a retry is currently in progress. */
  retrying: boolean;
}

/**
 * Hook that monitors online/offline status AND periodically pings a health URL.
 *
 * @param retryFn  — async function to call when the user hits "Retry" (e.g. re-fetch data).
 * @param healthUrl — optional URL to ping; defaults to `/api/tickets/stats/` which is lightweight.
 */
export function useNetworkStatus(
  retryFn?: () => void | Promise<void>,
  healthUrl = '/api/auth/me/',
): NetworkStatus {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Listen to browser online/offline events
  useEffect(() => {
    const goOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };
    const goOnline = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // Optional: periodically verify real connectivity (every 30s when offline)
  useEffect(() => {
    if (!isOffline) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(healthUrl, { method: 'HEAD', cache: 'no-store' });
        if (res.ok || res.status === 401) {
          // 401 means server is reachable, just not authenticated — that's fine
          setIsOffline(false);
        }
      } catch {
        // still offline
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [isOffline, healthUrl]);

  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      // First check connectivity
      const res = await fetch(healthUrl, { method: 'HEAD', cache: 'no-store' });
      if (res.ok || res.status === 401) {
        setIsOffline(false);
      }
    } catch {
      // still offline
    }
    // Also call the user's retry function
    if (retryFn) {
      try {
        await retryFn();
      } catch {
        // ignore — the page will handle its own error state
      }
    }
    setRetrying(false);
  }, [retryFn, healthUrl]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    isOffline: isOffline && !dismissed,
    retry,
    dismiss,
    retrying,
  };
}
