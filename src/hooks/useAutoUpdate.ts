import { useEffect, useRef } from 'react';

interface AutoUpdateOptions {
  onDataRefresh?: () => Promise<void> | void;
  pollIntervalMs?: number;
  checkVersionIntervalMs?: number;
}

export function useAutoUpdate({
  onDataRefresh,
  pollIntervalMs = 6000,
  checkVersionIntervalMs = 15000,
}: AutoUpdateOptions = {}) {
  const initialBuildTimestampRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);

  // 1. Check for new app version/deployment on server
  useEffect(() => {
    let isMounted = true;

    const checkAppVersion = async () => {
      try {
        const response = await fetch('/api/version', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });

        if (!response.ok) return;

        const data = await response.json();
        const serverTimestamp = data.timestamp;

        if (!serverTimestamp) return;

        if (initialBuildTimestampRef.current === null) {
          initialBuildTimestampRef.current = serverTimestamp;
        } else if (
          initialBuildTimestampRef.current !== serverTimestamp &&
          !isRefreshingRef.current
        ) {
          isRefreshingRef.current = true;
          console.log('[ChefMatch] Nova versão do servidor detectada. Atualizando aplicação...');
          // Force hard reload to pull latest JS bundles and HTML
          window.location.reload();
        }
      } catch {
        // Ignore network errors in background check
      }
    };

    // Run initial check
    checkAppVersion();

    // Check periodically for new deployments
    const versionInterval = setInterval(checkAppVersion, checkVersionIntervalMs);

    // Also check when tab becomes visible or focused
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        checkAppVersion();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      clearInterval(versionInterval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [checkVersionIntervalMs]);

  // 2. Auto-refresh data in background
  useEffect(() => {
    if (!onDataRefresh) return;

    let isMounted = true;

    const runSilentRefresh = async () => {
      if (!isMounted) return;
      if (typeof navigator !== 'undefined' && 'onLine' in navigator && !navigator.onLine) return;
      try {
        await onDataRefresh();
      } catch (err) {
        console.warn('[AutoSync] Background data refresh failed', err);
      }
    };

    // Periodic silent data polling
    const dataInterval = setInterval(runSilentRefresh, pollIntervalMs);

    // Immediate sync when tab gains focus or reconnects to internet
    const handleImmediateSync = () => {
      if (isMounted) {
        runSilentRefresh();
      }
    };

    window.addEventListener('focus', handleImmediateSync);
    window.addEventListener('online', handleImmediateSync);
    window.addEventListener('storage', handleImmediateSync);

    return () => {
      isMounted = false;
      clearInterval(dataInterval);
      window.removeEventListener('focus', handleImmediateSync);
      window.removeEventListener('online', handleImmediateSync);
      window.removeEventListener('storage', handleImmediateSync);
    };
  }, [onDataRefresh, pollIntervalMs]);
}
